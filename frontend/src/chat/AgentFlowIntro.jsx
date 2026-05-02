import React from 'react'
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

export function AgentFlowIntro({ onContinue }) {
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
          <button type="button" className="flow-intro-btn flow-intro-btn--primary" onClick={onContinue}>
            <span className="flow-intro-btn-label">Start chatting</span>
          </button>
          <p className="flow-intro-actions-hint">You can open this overview again from the chat toolbar anytime.</p>
        </div>
      </div>
    </div>
  )
}
