/**
 * Short labels for intro grid tiles (full pipeline order).
 */
export const AGENT_INTRO_LABELS = {
  prepare: 'Prepare',
  query_agent: 'Query',
  decision_agent: 'Decision',
  tool_agent: 'Tool',
  rag_agent: 'RAG',
  response_agent: 'Response',
}

/**
 * Three high-level stages for the pre-chat overview (row layout).
 */
export const FLOW_STAGES = [
  {
    key: 'ingestion',
    step: 1,
    title: 'Ingestion',
    subtitle: 'First: load the knowledge base',
    body:
      'Documents are chunked, embedded, and written to your vector store so later retrieval has grounded evidence. Run ingestion (e.g. your ingest script) before expecting RAG-quality answers.',
    visual: 'ingestion',
  },
  {
    key: 'agents',
    step: 2,
    title: 'Agents',
    subtitle: 'Then: orchestrated reasoning',
    body:
      'All six agents run in order: prepare → query → decision → tool or RAG → response. Each step appears in the chat thread as the graph executes.',
    visual: 'agents',
    agentIds: ['prepare', 'query_agent', 'decision_agent', 'tool_agent', 'rag_agent', 'response_agent'],
  },
  {
    key: 'response_memory',
    step: 3,
    title: 'Response · memory',
    subtitle: 'Finally: answer + session context',
    body:
      'Session memory keeps prior turns and context so follow-ups stay coherent—including short replies like “2” that refer to earlier choices.',
    visual: 'response_memory',
  },
]

export const INTRO_SESSION_KEY = 'multi-agent-intro-dismissed'
