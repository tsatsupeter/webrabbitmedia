import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'

export { money, money2, fmtDate, fmtDateTime, STATUS_LABEL, statusTone } from '../studio/lib'

export const ROLE_LABEL = {
  lead: 'Lead developer',
  developer: 'Developer',
  designer: 'Designer',
  qa: 'QA',
}

export const SENIORITY = [
  { id: 'junior', label: 'Junior', hint: '0–2 years' },
  { id: 'mid', label: 'Mid-level', hint: '2–5 years' },
  { id: 'senior', label: 'Senior', hint: '5–8 years' },
  { id: 'lead', label: 'Lead / architect', hint: '8+ years' },
]

export const AVAILABILITY = [
  { id: 'full_time', label: 'Full time', hint: '35+ hours a week' },
  { id: 'part_time', label: 'Part time', hint: '10–25 hours a week' },
  { id: 'weekends', label: 'Evenings & weekends', hint: 'Around another job' },
  { id: 'unavailable', label: 'Not available right now', hint: 'Keep me on the bench' },
]

export const SKILL_SUGGESTIONS = [
  'React', 'Next.js', 'Vue', 'React Native', 'Flutter', 'Node.js', 'Laravel', 'Django',
  'Python', 'PHP', 'Go', 'Supabase', 'Postgres', 'WordPress', 'Shopify', 'UI/UX design',
  'Figma', 'Payments integration', 'USSD', 'DevOps', 'QA / testing',
]

export const PAY_TYPE_LABEL = {
  fixed: 'Fixed project fee',
  per_milestone: 'Per milestone',
  hourly: 'Hourly',
}

/** The signed-in user's developer profile, if they have applied. */
export function useDeveloperProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('developer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setProfile(data || null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    load()
  }, [authLoading, load])

  return {
    profile,
    loading: authLoading || loading,
    approved: profile?.status === 'approved',
    refresh: load,
  }
}

/** Projects the signed-in developer is assigned to, newest first. */
export function useMyAssignments() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('project_assignments')
      .select('*, project:studio_projects(*)')
      .eq('developer_id', user.id)
      .order('assigned_at', { ascending: false })
    setRows((data || []).filter((r) => r.project))
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return { assignments: rows, loading, refresh: load }
}

/** One assigned project with everything the developer is allowed to see. */
export function useDevProject(id) {
  const { user } = useAuth()
  const [state, setState] = useState({
    project: null,
    milestones: [],
    messages: [],
    files: [],
    events: [],
    team: [],
    assignment: null,
    loading: true,
    notFound: false,
  })

  const load = useCallback(async () => {
    if (!id || !user) return
    const [p, m, msg, f, ev, team] = await Promise.all([
      supabase.from('studio_projects').select('*').eq('id', id).maybeSingle(),
      supabase.from('studio_milestones').select('*').eq('project_id', id).order('order_index'),
      supabase.from('studio_messages').select('*').eq('project_id', id).order('created_at'),
      supabase.from('studio_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('studio_events').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(30),
      supabase
        .from('project_assignments')
        .select('*, developer:developer_profiles(id, display_name, headline, avatar_url, skills)')
        .eq('project_id', id)
        .eq('status', 'active'),
    ])
    setState({
      project: p.data || null,
      milestones: m.data || [],
      messages: msg.data || [],
      files: f.data || [],
      events: ev.data || [],
      team: team.data || [],
      assignment: (team.data || []).find((a) => a.developer_id === user.id) || null,
      loading: false,
      notFound: !p.data,
    })
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`dev-project-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'studio_messages', filter: `project_id=eq.${id}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, load])

  return { ...state, refresh: load }
}

/** Earnings for the signed-in developer with their project titles. */
export function useMyEarnings() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('developer_earnings')
      .select('*, project:studio_projects(id, title)')
      .eq('developer_id', user.id)
      .order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return { earnings: rows, loading, refresh: load }
}

/** Split a comma or newline separated string into clean, unique chips. */
export function parseList(value) {
  return Array.from(
    new Set(
      String(value || '')
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  )
}
