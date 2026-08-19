import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'

export const money = (n, currency = 'GHS') =>
  `${currency} ${Number(n || 0).toLocaleString('en-GH', { maximumFractionDigits: 0 })}`

export const money2 = (n, currency = 'GHS') =>
  `${currency} ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

export const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

/** The lifecycle every project moves through, in order. */
export const STATUS_FLOW = [
  { id: 'submitted', label: 'Submitted', hint: 'We have your brief' },
  { id: 'reviewing', label: 'Reviewing', hint: 'We are scoping the work' },
  { id: 'proposal_sent', label: 'Proposal sent', hint: 'Waiting for your approval' },
  { id: 'approved', label: 'Approved', hint: 'Scope agreed' },
  { id: 'in_progress', label: 'In progress', hint: 'We are building' },
  { id: 'in_review', label: 'Your review', hint: 'Check the work' },
  { id: 'launched', label: 'Launched', hint: 'Live for your customers' },
  { id: 'care', label: 'Care', hint: 'Ongoing support' },
]

export const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Submitted',
  reviewing: 'Reviewing',
  proposal_sent: 'Proposal sent',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  in_progress: 'In progress',
  in_review: 'Your review',
  launched: 'Launched',
  care: 'Care',
  cancelled: 'Cancelled',
}

export function statusTone(status) {
  if (['launched', 'approved', 'care'].includes(status)) return 'success'
  if (['proposal_sent', 'in_review', 'changes_requested'].includes(status)) return 'warn'
  if (status === 'cancelled') return 'danger'
  return 'default'
}

export function statusIndex(status) {
  const i = STATUS_FLOW.findIndex((s) => s.id === status)
  if (i >= 0) return i
  if (status === 'changes_requested') return 2
  if (status === 'draft') return -1
  return 0
}

/** What the client should do next — drives the card CTA on the Studio home. */
export function nextAction(project) {
  switch (project.status) {
    case 'draft':
      return { label: 'Finish your brief', to: `/studio/new?draft=${project.id}` }
    case 'proposal_sent':
      return { label: 'Review proposal', to: `/studio/projects/${project.id}?tab=proposal` }
    case 'in_review':
      return { label: 'Review the work', to: `/studio/projects/${project.id}` }
    case 'launched':
    case 'care':
      return { label: 'Request a change', to: `/studio/projects/${project.id}?tab=changes` }
    default:
      return { label: 'Open project', to: `/studio/projects/${project.id}` }
  }
}

/** All projects the signed-in user can see (their own + workspace projects). */
export function useStudioProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('studio_projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { projects, loading, refresh: load }
}

/** One project plus everything attached to it, with realtime message updates. */
export function useStudioProject(id) {
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [invoices, setInvoices] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const [p, m, msg, f, inv, ev] = await Promise.all([
      supabase.from('studio_projects').select('*').eq('id', id).maybeSingle(),
      supabase.from('studio_milestones').select('*').eq('project_id', id).order('order_index'),
      supabase.from('studio_messages').select('*').eq('project_id', id).order('created_at'),
      supabase.from('studio_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('studio_invoices').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('studio_events').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ])
    if (!p.data) setNotFound(true)
    setProject(p.data || null)
    setMilestones(m.data || [])
    setMessages(msg.data || [])
    setFiles(f.data || [])
    setInvoices(inv.data || [])
    setEvents(ev.data || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`studio-project-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'studio_messages', filter: `project_id=eq.${id}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'studio_projects', filter: `id=eq.${id}` },
        (payload) => setProject((prev) => ({ ...(prev || {}), ...payload.new })),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, load])

  return { project, milestones, messages, files, invoices, events, loading, notFound, refresh: load }
}

/** Record a timeline event. Never throws — the timeline is a nice-to-have. */
export async function logEvent(projectId, type, message, details = {}, actor = {}) {
  try {
    await supabase.from('studio_events').insert({
      project_id: projectId,
      type,
      message,
      details,
      actor_id: actor.id ?? null,
      actor_label: actor.label ?? null,
    })
  } catch {
    /* ignore */
  }
}

/** Upload a file into the project's folder in the private studio-files bucket. */
export async function uploadProjectFile(projectId, file, { label, userId, role = 'client' } = {}) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${projectId}/${Date.now()}-${safe}`
  const { error: upErr } = await supabase.storage.from('studio-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (upErr) throw upErr
  const { error } = await supabase.from('studio_files').insert({
    project_id: projectId,
    uploaded_by: userId,
    uploader_role: role,
    label: label || file.name,
    path,
    kind: file.type || null,
    size_bytes: file.size,
  })
  if (error) throw error
  return path
}

export async function signedFileUrl(path) {
  const { data } = await supabase.storage.from('studio-files').createSignedUrl(path, 60 * 10)
  return data?.signedUrl || null
}

/** Call a studio edge function and surface the server's message. */
export async function invokeStudio(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body })
  if (error) {
    let message = error.message || 'Request failed'
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.message) message = ctx.message
      else if (ctx?.error) message = ctx.error
    } catch {
      /* non-JSON body */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.message || data.error)
  return data
}
