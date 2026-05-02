export const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const SESSION_STORAGE_KEY = 'multi-agent-session-id'

/** User-chosen display name from the intro screen (localStorage). */
export const USER_DISPLAY_NAME_KEY = 'multi-agent-display-name'

export const STEP_REVEAL_MS = 480
export const FIRST_STEP_DELAY_MS = 350
export const ANSWER_EXTRA_DELAY_MS = 320

export const CHAT_FLOW_STEPS = [
  { key: 'prepare', label: 'Prepare', agentId: 'prepare' },
  { key: 'query', label: 'Query', agentId: 'query_agent' },
  { key: 'decision', label: 'Decision', agentId: 'decision_agent' },
  { key: 'exec', label: 'Tool / RAG', agentId: 'tool_agent' },
  { key: 'response', label: 'Response', agentId: 'response_agent' },
]
