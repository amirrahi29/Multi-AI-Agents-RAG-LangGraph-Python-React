import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { AssistantTurnBlock } from './chat/AssistantTurnBlock'
import { ChatPipelineLegend } from './chat/AssistantParts'
import { AssistantTypingRow, UserMessageRow } from './chat/MessageRows'
import { MicIcon, SendIcon, SparkleIcon } from './chat/icons'
import botLogo from './assets/bot-logo.svg'
import { getOrCreateSessionId, randomId } from './chat/utils'
import { SESSION_STORAGE_KEY } from './chat/constants'
import { useChatQuery } from './chat/useChatQuery'
import { AgentFlowIntro } from './chat/AgentFlowIntro'
import { INTRO_SESSION_KEY } from './chat/agentFlowExplain'

function introInitiallyHidden() {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

const App = () => {
  const [showIntro, setShowIntro] = useState(() => !introInitiallyHidden())
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(getOrCreateSessionId)
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const { messages, setMessages, loading, sendQuery, setLastContextQuery } = useChatQuery(sessionId, setSessionId)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

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

    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)

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

  const dismissIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    setShowIntro(false)
  }, [])

  const openIntro = useCallback(() => setShowIntro(true), [])

  const startNewChat = useCallback(() => {
    const id = randomId()
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
    setSessionId(id)
    setMessages([])
    setLastContextQuery(null)
    setInput('')
  }, [setMessages, setLastContextQuery])

  const submitMessage = useCallback(() => {
    const raw = input.trim()
    if (!raw || loading) return
    setInput('')
    sendQuery(raw)
  }, [input, loading, sendQuery])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitMessage()
    }
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand-row">
            <div className="brand">
              <div className="brand-mark" aria-hidden>
                <img src={botLogo} alt="" className="brand-mark-img" width={44} height={44} decoding="async" />
              </div>
              <div className="brand-text">
                <h1>Multi-Agent Assistant</h1>
                <p>LangGraph pipeline: query → decision → tool or RAG → response. Voice: Chrome / Edge.</p>
              </div>
            </div>
            <div className="header-actions">
              {showIntro ? (
                <button type="button" className="btn-header btn-header--ghost" onClick={dismissIntro}>
                  Skip to chat
                </button>
              ) : (
                <>
                  <button type="button" className="btn-header btn-header--ghost" onClick={openIntro}>
                    How it works
                  </button>
                  <button type="button" className="btn-header" onClick={startNewChat} disabled={loading}>
                    New session
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-main">
        {showIntro ? (
          <AgentFlowIntro onContinue={dismissIntro} />
        ) : (
          <div className="app-shell app-shell--chat">
            <div className="chat-panel chat-panel--unified" aria-label="Chat and orchestration">
              <div className="chat-panel-toolbar">
                <div className="chat-toolbar-left">
                  <ChatPipelineLegend />
                  <button type="button" className="btn-toolbar-flow" onClick={openIntro}>
                    How it works
                  </button>
                </div>
                <div className="chat-toolbar-right">
                <span className="badge-live">
                  <span className="toolbar-pulse" />
                  API
                </span>
                <span className="badge-soft">{messages.length} messages</span>
              </div>
            </div>

            <div
              className={`messages messages--chat${messages.length === 0 && !loading ? ' messages--chat--empty' : ''}`}
            >
              {messages.length === 0 && !loading && (
                <div className="empty-state empty-state--compact">
                  <div className="empty-state-icon" aria-hidden>
                    <SparkleIcon />
                  </div>
                  <div>
                    <h2>Start a run</h2>
                    <p>Each reply shows agents step by step in this thread, then the final answer.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) =>
                msg.role === 'user' ? (
                  <UserMessageRow key={msg.id ?? `u-${i}`} content={msg.content} />
                ) : (
                  <AssistantTurnBlock key={msg.id ?? `a-${i}`} msg={msg} onPipelineTick={scrollToBottom} />
                ),
              )}

              {loading ? <AssistantTypingRow /> : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="composer-wrap">
              <div className="composer">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Write a message…"
                  disabled={loading}
                  rows={1}
                  aria-label="Message"
                />
                <div className="composer-footer">
                  <span className="composer-footer-hint" aria-hidden>
                    <kbd className="composer-kbd">Enter</kbd> send · <kbd className="composer-kbd">Shift</kbd>+
                    <kbd className="composer-kbd">Enter</kbd> line
                  </span>
                  <div className="composer-actions">
                    {speechSupported ? (
                      <button
                        type="button"
                        className={`icon-btn icon-btn--composer ${listening ? 'recording' : ''}`}
                        onClick={toggleListening}
                        disabled={loading}
                        title={listening ? 'Stop recording' : 'Speech to text'}
                        aria-label={listening ? 'Stop recording' : 'Start speech to text'}
                      >
                        <MicIcon />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="composer-send"
                      onClick={submitMessage}
                      disabled={loading || !input.trim()}
                      aria-label="Send message"
                    >
                      <SendIcon />
                      Send
                    </button>
                  </div>
                </div>
              </div>
              <p className="composer-hint">
                Session stored in this browser. Orchestration is saved with each assistant reply.
              </p>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default App
