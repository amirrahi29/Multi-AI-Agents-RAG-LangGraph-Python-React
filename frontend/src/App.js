import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const SESSION_STORAGE_KEY = 'multi-agent-session-id'

const isDigitOnly = (s) => /^\d+$/.test(String(s).trim())


function getOrCreateSessionId() {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function routePillClass(meta) {
  if (!meta) return 'tool'
  if (meta === 'Error') return 'error'
  if (meta.includes('Tool')) return 'tool'
  return 'rag'
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 3v4M12 17v4M5.64 5.64l2.83 2.83M15.53 15.53l2.83 2.83M3 12h4M17 12h4M5.64 18.36l2.83-2.83M15.53 8.47l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2l1.09 5.26L18 9l-5.91.74L12 15l-1.09-5.26L5 9l5.91-.74L12 2z" strokeLinejoin="round" />
    </svg>
  )
}

const App = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastContextQuery, setLastContextQuery] = useState(null)
  const [sessionId, setSessionId] = useState(getOrCreateSessionId)
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) return
    setSpeechSupported(true)
    const rec = new SR()
    rec.lang = 'hi-IN'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (event) => {
      const chunks = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunks.push(event.results[i][0].transcript)
      }
      const text = chunks.join('').trim()
      if (!text) return
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
    }

    rec.onerror = () => {
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
    }

    recognitionRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const toggleListening = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
      setListening(false)
      return
    }
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [listening])

  const startNewChat = useCallback(() => {
    const id = crypto.randomUUID()
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
    setSessionId(id)
    setMessages([])
    setLastContextQuery(null)
    setInput('')
  }, [])

  const sendQuery = useCallback(async () => {
    const raw = input.trim()
    if (!raw || loading) return

    setLoading(true)
    setInput('')

    const userMsg = { role: 'user', content: raw }
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
          role: 'assistant',
          content: data.response ?? '',
          meta: routeLabel,
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
          role: 'assistant',
          content: `Error: ${msg}. Is the API running at ${API_BASE}?`,
          meta: 'Error',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, lastContextQuery, sessionId])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuery()
    }
  }

  return (
    <div className="app">
      <div className="app-shell">
          <header className="app-header">
            <div className="brand-row">
              <div className="brand">
                <div className="brand-mark" aria-hidden>
                  <BrandIcon />
                </div>
                <div className="brand-text">
                  <h1>Multi-Agent Assistant</h1>
                  <p>
                    Tool-backed lookups and RAG, with session memory. Mic works best in Chrome or Edge (Hindi /
                    English).
                  </p>
                </div>
              </div>
              <div className="header-actions">
                <button type="button" className="btn-secondary" onClick={startNewChat} disabled={loading}>
                  New chat
                </button>
              </div>
            </div>
          </header>

          <div className="chat-panel">
            <div className="chat-toolbar">
              <span className="toolbar-live">
                <span className="toolbar-pulse" />
                Connected
              </span>
              <span aria-hidden>·</span>
              <span>Routes to Tool agent or RAG based on your question</span>
            </div>

            <div className="messages">
              {messages.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-state-icon" aria-hidden>
                    <SparkleIcon />
                  </div>
                  <div>
                    <h2>Ask anything to get started</h2>
                    <p>Orders, payments, user lists, or general knowledge from your indexed documents.</p>
                  </div>
            
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.role}`}>
                  <div className="msg-avatar" aria-hidden>
                    {msg.role === 'user' ? 'Me' : 'AI'}
                  </div>
                  <div className="msg-body">
                    <div className={`message ${msg.role}`}>{msg.content}</div>
                    {msg.meta && msg.role === 'assistant' && (
                      <div className="meta-row">
                        <span className={`route-pill ${routePillClass(msg.meta)}`}>{msg.meta}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="msg-row assistant">
                  <div className="msg-avatar" aria-hidden>
                    AI
                  </div>
                  <div className="msg-body">
                    <div className="message assistant typing-bubble" aria-busy="true" aria-live="polite">
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className="meta-row">
                      <span className="route-pill rag">Running pipeline…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="composer-wrap">
              <div className="composer">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message… (Enter to send, Shift+Enter for new line)"
                  disabled={loading}
                  rows={2}
                  aria-label="Message"
                />
                <div className="composer-actions">
                  {speechSupported && (
                    <button
                      type="button"
                      className={`icon-btn ${listening ? 'recording' : ''}`}
                      onClick={toggleListening}
                      disabled={loading}
                      title={listening ? 'Stop recording' : 'Speech to text'}
                      aria-label={listening ? 'Stop recording' : 'Start speech to text'}
                    >
                      <MicIcon />
                    </button>
                  )}
                  <button
                    type="button"
                    className="composer-send"
                    onClick={sendQuery}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                  >
                    <SendIcon />
                    Send
                  </button>
                </div>
              </div>
              <p className="composer-hint">
                Session saved in this browser.
                {!speechSupported && ' Voice input needs Web Speech API (Chrome / Edge).'}
              </p>
            </div>
          </div>

        </div>
      </div>
  )
}

export default App
