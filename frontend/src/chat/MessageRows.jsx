import React from 'react'
import { AssistantBotIcon, UserFaceIcon } from './icons'

export function UserMessageRow({ content }) {
  return (
    <div className="msg-row user msg-row--user-send" aria-label="Your message">
      <div className="msg-avatar msg-avatar--user" aria-hidden>
        <UserFaceIcon className="msg-avatar-icon" />
      </div>
      <div className="msg-body">
        <div className="message user message--user-send">{content}</div>
      </div>
    </div>
  )
}

export function AssistantTypingRow() {
  return (
    <div className="loading-turn">
      <div className="msg-row assistant msg-row--typing" aria-busy="true" aria-label="Assistant is typing">
        <div className="msg-avatar msg-avatar--assistant" aria-hidden>
          <AssistantBotIcon className="msg-avatar-icon" />
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
    </div>
  )
}
