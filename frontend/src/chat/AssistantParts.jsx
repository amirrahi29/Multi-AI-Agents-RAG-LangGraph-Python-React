import React, { useState } from 'react'
import { AgentGlyph, AssistantBotIcon, CheckBoldIcon, RagAgentIcon, SparkleIcon, ToolAgentIcon } from './icons'
import { CHAT_FLOW_STEPS } from './constants'
import { pipeAvatarClass } from './utils'

export function StepRawBlock({ detail }) {
  const [expanded, setExpanded] = useState(false)
  if (!detail) return null
  const long = detail.length > 320
  return (
    <div className="agent-raw">
      <div className="agent-raw-head">Agent output</div>
      <pre className={`agent-raw-pre ${expanded || !long ? 'agent-raw-pre--open' : ''}`}>{detail}</pre>
      {long ? (
        <button type="button" className="agent-raw-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Show full output'}
        </button>
      ) : null}
    </div>
  )
}

export function PipelineSteps({ steps }) {
  if (steps.length === 0) return null
  return (
    <div className="assistant-turn-pipeline assistant-turn-pipeline--timeline" aria-label="Agent steps for this reply">
      <p className="pipeline-block-label">
        <SparkleIcon className="pipeline-block-label-icon" aria-hidden />
        <span>Agents · step-by-step</span>
      </p>
      {steps.map((step, idx) => (
        <div
          key={`${step.id}-${idx}`}
          className="chat-agent-step"
          style={{ '--step-i': idx }}
        >
          <div className="chat-agent-step-status-col" aria-hidden>
            {idx > 0 ? <span className="chat-agent-step-status-line chat-agent-step-status-line--before" /> : null}
            <span className="chat-agent-step-check" title="Done">
              <CheckBoldIcon className="chat-agent-step-check-icon" strokeWidth={2.8} />
            </span>
            {idx < steps.length - 1 ? <span className="chat-agent-step-status-line chat-agent-step-status-line--after" /> : null}
          </div>
          <div className={`chat-agent-step-avatar ${pipeAvatarClass(step.id)}`} aria-hidden>
            <AgentGlyph agentId={step.id} className="chat-agent-step-icon" />
          </div>
          <div className="chat-agent-step-body">
            <div className="chat-agent-step-head">
              <span className="chat-agent-step-label">{step.label}</span>
              <code className="chat-agent-step-id">{step.id}</code>
            </div>
            {step.summary ? <p className="chat-agent-step-summary">{step.summary}</p> : null}
            <StepRawBlock detail={step.detail} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Assistant message row: final answer text, route pill, “done” avatar badge. */
export function FinalAnswerRow({ content, meta, routePillClass }) {
  return (
    <div className="msg-row assistant msg-row--final" aria-label="Final answer">
      <div className="msg-avatar-wrap msg-avatar-wrap--final">
        <div className="msg-avatar msg-avatar--assistant msg-avatar--final" aria-hidden>
          <AssistantBotIcon className="msg-avatar-icon" />
        </div>
        <span className="avatar-done-badge" title="Response ready" aria-hidden>
          <CheckBoldIcon className="avatar-done-icon" strokeWidth={3} />
        </span>
      </div>
      <div className="msg-body msg-body--final">
        <div className="final-answer-head">
          <span className="final-answer-pill">
            <CheckBoldIcon className="final-answer-check" strokeWidth={2.2} />
            Final answer
          </span>
        </div>
        <div className="message assistant message--final">{content}</div>
        {meta ? (
          <div className="meta-row meta-row--final">
            <span className="meta-via">Via</span>
            <span className={`route-pill ${routePillClass(meta)}`}>{meta}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ChatPipelineLegend() {
  return (
    <div className="chat-pipeline-legend" aria-label="Pipeline overview">
      <span className="chat-pipeline-legend-label">Flow</span>
      <span className="chat-pipeline-steps">
        {CHAT_FLOW_STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 ? (
              <span className="chat-pipeline-sep chat-pipeline-sep--in" style={{ '--flow-s': i }} aria-hidden>
                →
              </span>
            ) : null}
            <span className="chat-pipeline-step chat-pipeline-step--in" style={{ '--flow-i': i }}>
              {s.key === 'exec' ? (
                <span className="chat-pipeline-step-icons" aria-hidden>
                  <ToolAgentIcon className="chat-pipeline-mini-icon" />
                  <RagAgentIcon className="chat-pipeline-mini-icon" />
                </span>
              ) : (
                <AgentGlyph agentId={s.agentId} className="chat-pipeline-mini-icon" />
              )}
              <span>{s.label}</span>
            </span>
          </React.Fragment>
        ))}
      </span>
    </div>
  )
}
