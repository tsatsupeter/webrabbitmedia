// Docs Assistant — answers questions strictly from the Web Rabbit documentation.
// Streams a DeepSeek chat completion back to the browser and persists the turn.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY')!

type Ctx = { slug: string; title: string; text: string }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const SYSTEM = `You are the Web Rabbit Media documentation assistant.

Rules:
- Answer ONLY from the documentation excerpts provided in the context block.
- If the excerpts do not contain the answer, reply exactly: "I couldn't find that in the Web Rabbit docs." and suggest the closest documented topic.
- Never invent endpoints, parameters, fields, prices, or behaviour.
- Be concise. Use markdown: short paragraphs, bullet lists, and fenced code blocks with a language tag.
- Prefer the exact naming, base URLs, and code style used in the excerpts.
- End with a "Sources" line listing the docs page titles you used.
- Do not answer questions unrelated to Web Rabbit Media's products or APIs; say they are outside the documentation.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    if (!DEEPSEEK_KEY) return json({ error: 'DEEPSEEK_API_KEY is not configured' }, 500)

    const token = (req.headers.get('authorization') || '').replace(/^bearer /i, '').trim()
    if (!token) return json({ error: 'unauthorized' }, 401)

    const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
    const { data: userRes } = await db.auth.getUser(token)
    const user = userRes?.user
    if (!user) return json({ error: 'unauthorized' }, 401)

    const body = (await req.json().catch(() => ({}))) as {
      thread_id?: string
      question?: string
      context?: Ctx[]
      history?: { role: 'user' | 'assistant'; content: string }[]
    }

    const question = String(body.question || '').trim()
    const threadId = String(body.thread_id || '').trim()
    if (!question) return json({ error: 'question_required' }, 400)
    if (question.length > 2000) return json({ error: 'question_too_long' }, 400)
    if (!threadId) return json({ error: 'thread_required' }, 400)

    const { data: thread, error: threadErr } = await db
      .from('docs_chat_threads')
      .select('id, user_id, title')
      .eq('id', threadId)
      .maybeSingle()
    if (threadErr) return json({ error: threadErr.message }, 500)
    if (!thread || thread.user_id !== user.id) return json({ error: 'thread_not_found' }, 404)

    const context = (Array.isArray(body.context) ? body.context : [])
      .slice(0, 6)
      .map((c) => ({
        slug: String(c?.slug || '').slice(0, 80),
        title: String(c?.title || '').slice(0, 120),
        text: String(c?.text || '').slice(0, 8000),
      }))
      .filter((c) => c.slug && c.text)

    const contextBlock = context.length
      ? context.map((c) => `### ${c.title} (/docs/${c.slug})\n${c.text}`).join('\n\n---\n\n')
      : 'No documentation excerpts matched this question.'

    const history = (Array.isArray(body.history) ? body.history : [])
      .slice(-8)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }))

    const sources = context.map((c) => ({ slug: c.slug, title: c.title }))

    // Persist the question first so history survives a failed stream.
    const { error: insErr } = await db.from('docs_chat_messages').insert({
      thread_id: threadId,
      user_id: user.id,
      role: 'user',
      content: question,
    })
    if (insErr) console.error('docs-assistant: user message insert failed', insErr.message)

    if (!thread.title || thread.title === 'New chat') {
      await db
        .from('docs_chat_threads')
        .update({ title: question.slice(0, 70), updated_at: new Date().toISOString() })
        .eq('id', threadId)
    } else {
      await db.from('docs_chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId)
    }

    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM },
          ...history,
          {
            role: 'user',
            content: `Documentation context:\n\n${contextBlock}\n\n---\n\nQuestion: ${question}`,
          },
        ],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      console.error('deepseek error', upstream.status, detail.slice(0, 500))
      const message =
        upstream.status === 401
          ? 'The DeepSeek API key was rejected. Update the DEEPSEEK_API_KEY secret.'
          : upstream.status === 402
            ? 'The DeepSeek account is out of credit.'
            : upstream.status === 429
              ? 'DeepSeek is rate limiting requests. Try again in a moment.'
              : 'The assistant is temporarily unavailable.'
      return json({ error: message, status: upstream.status }, upstream.status === 429 ? 429 : 502)
    }

    let answer = ''
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        // First frame carries the sources so the UI can render citations immediately.
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n'))

        const reader = upstream.body!.getReader()
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const payload = trimmed.slice(5).trim()
              if (!payload || payload === '[DONE]') continue
              try {
                const parsed = JSON.parse(payload)
                const delta = parsed?.choices?.[0]?.delta?.content
                if (delta) {
                  answer += delta
                  controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'))
                }
              } catch {
                // ignore keep-alive / partial frames
              }
            }
          }
        } catch (e) {
          console.error('docs-assistant stream error', e)
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'error', message: 'The answer stream was interrupted.' }) + '\n'),
          )
        }

        const { error: saveErr } = await db.from('docs_chat_messages').insert({
          thread_id: threadId,
          user_id: user.id,
          role: 'assistant',
          content: answer,
          sources,
        })
        if (saveErr) console.error('docs-assistant: assistant message insert failed', saveErr.message)

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e) {
    console.error('docs-assistant error', e)
    return json({ error: e instanceof Error ? e.message : 'internal_error' }, 500)
  }
})
