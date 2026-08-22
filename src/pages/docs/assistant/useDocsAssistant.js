import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../integrations/supabase/client'
import { retrieve } from './retrieve'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/docs-assistant`

export function useThreads(userId) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setThreads([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('docs_chat_threads')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)
    setThreads(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { threads, loading, refresh, setThreads }
}

export async function createThread(userId, title = 'New chat') {
  const { data, error } = await supabase
    .from('docs_chat_threads')
    .insert({ user_id: userId, title })
    .select('id, title, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function deleteThread(id) {
  const { error } = await supabase.from('docs_chat_threads').delete().eq('id', id)
  if (error) throw error
}

/** Messages + streaming for one thread. */
export function useDocsChat(threadId, userId) {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | streaming | error
  const [error, setError] = useState('')
  const abortRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setMessages([])
    setError('')
    setStatus('idle')
    if (!threadId || !userId) return
    ;(async () => {
      const { data } = await supabase
        .from('docs_chat_messages')
        .select('id, role, content, sources, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
      if (!cancelled) setMessages(data || [])
    })()
    return () => {
      cancelled = true
    }
  }, [threadId, userId])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle')
  }, [])

  const send = useCallback(
    async (question, onThreadTouched) => {
      const text = String(question || '').trim()
      if (!text || !threadId || status === 'streaming' || status === 'loading') return

      setError('')
      setStatus('loading')
      const localId = `local-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: localId, role: 'user', content: text, sources: [] },
        { id: `${localId}-a`, role: 'assistant', content: '', sources: [], pending: true },
      ])

      const history = messages
        .filter((m) => m.content)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }))

      const context = retrieve(text, 5).map((p) => ({ slug: p.slug, title: p.title, text: p.text }))

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) throw new Error('Please sign in to use the assistant.')

        const res = await fetch(FN_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ thread_id: threadId, question: text, context, history }),
        })

        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error || 'The assistant is temporarily unavailable.')
        }

        setStatus('streaming')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let answer = ''
        let sources = []

        const flush = () =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === `${localId}-a` ? { ...m, content: answer, sources, pending: false } : m,
            ),
          )

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (!line.trim()) continue
            let evt
            try {
              evt = JSON.parse(line)
            } catch {
              continue
            }
            if (evt.type === 'sources') sources = evt.sources || []
            if (evt.type === 'delta') answer += evt.text
            if (evt.type === 'error') setError(evt.message)
          }
          flush()
        }
        flush()
        setStatus('idle')
        onThreadTouched?.()
      } catch (e) {
        if (e.name === 'AbortError') return
        setError(e.message || 'Something went wrong.')
        setStatus('error')
        setMessages((prev) => prev.filter((m) => m.id !== `${localId}-a`))
      } finally {
        abortRef.current = null
      }
    },
    [threadId, messages, status],
  )

  return { messages, status, error, send, stop }
}
