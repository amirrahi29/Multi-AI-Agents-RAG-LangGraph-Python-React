import React, { useState } from 'react'
import {
  AgentGlyph,
  AssistantBotIcon,
  IngestionIcon,
  MemoryIcon,
  ResponseAgentIcon,
} from './icons'
import { pipeAvatarClass } from './utils'
import { AGENT_INTRO_LABELS, FLOW_STAGES } from './agentFlowExplain'

function IngestionVisual() {
  return (
    <div className="flow-intro-visual flow-intro-visual--ingestion" aria-hidden>
      <div className="flow-intro-hero-icon flow-intro-hero-icon--ingest">
        <IngestionIcon className="flow-intro-hero-glyph" />
      </div>
      <div className="flow-intro-mini-labels">
        <span>Docs</span>
        <span className="flow-intro-mini-arrow">→</span>
        <span>Chunks</span>
        <span className="flow-intro-mini-arrow">→</span>
        <span>Vectors</span>
      </div>
    </div>
  )
}

function AgentsVisual({ agentIds = [] }) {
  return (
    <div className="flow-intro-visual flow-intro-visual--agents" aria-hidden>
      <div className="flow-intro-agent-grid">
        {agentIds.map((id, i) => (
          <div key={id} className="flow-intro-agent-cell" style={{ '--agent-i': i }}>
            <div className={`flow-intro-agent-tile ${pipeAvatarClass(id)}`} title={id}>
              <AgentGlyph agentId={id} className="flow-intro-agent-tile-icon" />
            </div>
            <span className="flow-intro-agent-name">{AGENT_INTRO_LABELS[id] || id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResponseMemoryVisual() {
  return (
    <div className="flow-intro-visual flow-intro-visual--memory" aria-hidden>
      <div className="flow-intro-dual-heroes">
        <div className="flow-intro-hero-icon flow-intro-hero-icon--response">
          <ResponseAgentIcon className="flow-intro-hero-glyph" />
        </div>
        <div className="flow-intro-hero-icon flow-intro-hero-icon--mem">
          <MemoryIcon className="flow-intro-hero-glyph" />
        </div>
      </div>
      <div className="flow-intro-mini-labels flow-intro-mini-labels--center">
        <AssistantBotIcon className="flow-intro-inline-bot" />
        <span>Answer</span>
        <span className="flow-intro-plus">+</span>
        <span>Session memory</span>
      </div>
    </div>
  )
}

export function AgentFlowIntro({ onContinue, defaultDisplayName = '' }) {
  const [name, setName] = useState(() => defaultDisplayName.trim())
  const nameOk = name.trim().length > 0

  return (
    <div className="flow-intro" aria-label="How the system works: ingestion, agents, response">
      <div className="flow-intro-content">
        <header className="flow-intro-header">
          <h2 className="flow-intro-title">
            <span className="flow-intro-title-accent">From ingestion</span> to answer
          </h2>
          <p className="flow-intro-lead">
            Three stages in order: load knowledge, run specialized agents, then reply with memory-aware context.
          </p>
        </header>

        <div className="flow-intro-row" role="list">
          {FLOW_STAGES.map((stage, index) => (
            <React.Fragment key={stage.key}>
              {index > 0 ? (
                <span
                  className="flow-intro-between flow-intro-connector"
                  style={{ '--conn-i': index - 1 }}
                  aria-hidden
                >
                  <span className="flow-intro-between-line" />
                  <span className="flow-intro-between-arrow">→</span>
                  <span className="flow-intro-between-line" />
                </span>
              ) : null}
              <article
                className="flow-intro-col"
                style={{ '--flow-i': index }}
                role="listitem"
                aria-label={`Step ${stage.step}: ${stage.title}`}
              >
                <span className="flow-intro-step-badge">Step {stage.step}</span>
                {stage.visual === 'ingestion' ? (
                  <IngestionVisual />
                ) : stage.visual === 'agents' ? (
                  <AgentsVisual agentIds={stage.agentIds} />
                ) : (
                  <ResponseMemoryVisual />
                )}
                <h3 className="flow-intro-col-title">{stage.title}</h3>
                <p className="flow-intro-col-sub">{stage.subtitle}</p>
                <p className="flow-intro-col-body">{stage.body}</p>
              </article>
            </React.Fragment>
          ))}
        </div>

        <div className="flow-intro-actions">
          <div className="flow-intro-name-row">
            <label htmlFor="flow-intro-display-name" className="flow-intro-name-label">
              Your name
            </label>
            <input
              id="flow-intro-display-name"
              type="text"
              className="flow-intro-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameOk) {
                  e.preventDefault()
                  onContinue(name.trim())
                }
              }}
              placeholder="e.g. Amir"
              autoComplete="name"
              maxLength={80}
              aria-required="true"
            />
            <button
              type="button"
              className="flow-intro-btn flow-intro-btn--primary flow-intro-btn--row"
              onClick={() => nameOk && onContinue(name.trim())}
              disabled={!nameOk}
              aria-disabled={!nameOk}
            >
              <span className="flow-intro-btn-label">Start chatting</span>
            </button>
          </div>
          <p className="flow-intro-name-hint">Name is required. It appears in the chat toolbar greeting.</p>
          <p className="flow-intro-actions-hint">
            Open this overview anytime from <strong>Overview</strong> in the chat toolbar. Sharing this browser? Use{' '}
            <strong>Switch user</strong> in the header so someone else can enter their name.
          </p>
        </div>
      </div>
    </div>
  )
}
