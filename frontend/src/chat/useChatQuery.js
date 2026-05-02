import { useCallback, useState } from 'react'
import { API_BASE, SESSION_STORAGE_KEY } from './constants'
import { isDigitOnly, randomId } from './utils'

/**
 * Sends user text to `/query`, appends user + assistant messages, keeps session + follow-up context.
 */
export function useChatQuery(sessionId, setSessionId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastContextQuery, setLastContextQuery] = useState(null)

  const sendQuery = useCallback(
    async (rawInput) => {
      const raw = rawInput.trim()
      if (!raw || loading) return

      setLoading(true)

      const userMsg = { id: randomId(), role: 'user', content: raw }
      setMessages((m) => [...m, userMsg])

      const lastQuery = isDigitOnly(raw) ? lastContextQuery : null
      const body = {
        query: raw,
        last_query: lastQuery,
        session_id: sessionId,
      }

      try {
        const res = await fetch(`${API_BASE}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Request failed (${res.status})`)
        }

        const data = await res.json()
        const routeLabel = data.route === 'tool' ? 'Tool agent' : 'RAG agent'

        if (data.session_id && data.session_id !== sessionId) {
          setSessionId(data.session_id)
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, data.session_id)
          } catch {
            /* ignore */
          }
        }

        setMessages((m) => [
          ...m,
          {
            id: randomId(),
            role: 'assistant',
            content: data.response ?? '',
            meta: routeLabel,
            pipelineTrace: Array.isArray(data.pipeline_trace) ? data.pipeline_trace : [],
          },
        ])

        if (!isDigitOnly(raw)) {
          setLastContextQuery(raw)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong'
        setMessages((m) => [
          ...m,
          {
            id: randomId(),
            role: 'assistant',
            content: `Error: ${msg}. Is the API running at ${API_BASE}?`,
            meta: 'Error',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, lastContextQuery, sessionId, setSessionId],
  )

  return {
    messages,
    setMessages,
    loading,
    sendQuery,
    lastContextQuery,
    setLastContextQuery,
  }
}
