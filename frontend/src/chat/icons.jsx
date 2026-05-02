import React from 'react'

function IconSvg({ children, className, ...rest }) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className} {...rest}>
      {children}
    </svg>
  )
}

export function PrepareInputIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </IconSvg>
  )
}

export function QueryAgentIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </IconSvg>
  )
}

export function DecisionAgentIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <path d="m12 11-5 9M12 11l5 9" />
    </IconSvg>
  )
}

export function ToolAgentIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </IconSvg>
  )
}

export function RagAgentIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h5" />
    </IconSvg>
  )
}

export function ResponseAgentIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </IconSvg>
  )
}

export function UserFaceIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconSvg>
  )
}

export function AssistantBotIcon({ className, ...rest }) {
  return (
    <IconSvg viewBox="0 0 24 24" className={className} {...rest}>
      <rect x="5" y="8" width="14" height="12" rx="3" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <circle cx="9.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <path d="M10 17h4" />
    </IconSvg>
  )
}

export function MicIcon({ className, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={className} {...rest}>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" />
    </svg>
  )
}

export function SendIcon({ className, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={className} {...rest}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

export function SparkleIcon({ className, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={className} {...rest}>
      <path d="M12 2l1.09 5.26L18 9l-5.91.74L12 15l-1.09-5.26L5 9l5.91-.74L12 2z" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckBoldIcon({ className, strokeWidth = 3, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} aria-hidden {...rest}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const AGENT_ICONS = {
  prepare: PrepareInputIcon,
  query_agent: QueryAgentIcon,
  decision_agent: DecisionAgentIcon,
  tool_agent: ToolAgentIcon,
  rag_agent: RagAgentIcon,
  response_agent: ResponseAgentIcon,
}

export function AgentGlyph({ agentId, className, title: titleProp }) {
  const C = AGENT_ICONS[agentId] || QueryAgentIcon
  return <C className={className} title={titleProp} />
}
