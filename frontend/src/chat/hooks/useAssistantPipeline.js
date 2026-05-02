import { useEffect, useMemo, useState } from 'react'
import { ANSWER_EXTRA_DELAY_MS, FIRST_STEP_DELAY_MS, STEP_REVEAL_MS } from '../constants'

const STEPS_EXCLUDE_FINAL = (trace) =>
  Array.isArray(trace) ? trace.filter((s) => s?.id && s.id !== 'response_agent') : []

/** When the API omits `pipeline_trace`, still show an ordered run for UX. */
function buildSyntheticPipelineSteps(routeMeta) {
  if (!routeMeta || routeMeta === 'Error') return []
  const isTool = String(routeMeta).includes('Tool')
  const execId = isTool ? 'tool_agent' : 'rag_agent'
  const execLabel = isTool ? 'Tool agent' : 'RAG agent'
  return [
    { id: 'prepare', label: 'Prepare input', summary: 'Query normalized and ready for the agent graph.' },
    { id: 'query_agent', label: 'Query agent', summary: 'Intent and task type classified for this turn.' },
    {
      id: 'decision_agent',
      label: 'Decision agent',
      summary: isTool
        ? 'Route locked to tool path (structured data / SQL).'
        : 'Route locked to RAG path (vector document search).',
    },
    {
      id: execId,
      label: execLabel,
      summary: isTool
        ? 'Structured lookup completed for this reply.'
        : 'Relevant chunks retrieved and ranked for this reply.',
    },
  ]
}

export function useAssistantPipeline(pipelineTrace, fallbackRouteMeta, onPipelineTick) {
  const stepsBeforeAnswer = useMemo(() => {
    const fromApi = STEPS_EXCLUDE_FINAL(pipelineTrace)
    if (fromApi.length > 0) return fromApi
    return buildSyntheticPipelineSteps(fallbackRouteMeta)
  }, [pipelineTrace, fallbackRouteMeta])
  const skipPipeline = stepsBeforeAnswer.length === 0
  const [revealed, setRevealed] = useState(0)
  const [answerVisible, setAnswerVisible] = useState(skipPipeline)

  useEffect(() => {
    if (skipPipeline) {
      setRevealed(0)
      setAnswerVisible(true)
      return undefined
    }
    const timers = []
    const schedule = (fn, ms) => {
      timers.push(setTimeout(fn, ms))
    }
    setRevealed(0)
    setAnswerVisible(false)
    const instant =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (instant) {
      setRevealed(stepsBeforeAnswer.length)
      setAnswerVisible(true)
      return () => timers.forEach(clearTimeout)
    }
    for (let i = 0; i < stepsBeforeAnswer.length; i += 1) {
      const idx = i
      schedule(() => setRevealed(idx + 1), FIRST_STEP_DELAY_MS + idx * STEP_REVEAL_MS)
    }
    schedule(
      () => setAnswerVisible(true),
      FIRST_STEP_DELAY_MS + stepsBeforeAnswer.length * STEP_REVEAL_MS + ANSWER_EXTRA_DELAY_MS,
    )
    return () => timers.forEach(clearTimeout)
  }, [skipPipeline, pipelineTrace, fallbackRouteMeta, stepsBeforeAnswer.length])

  useEffect(() => {
    onPipelineTick?.()
  }, [revealed, answerVisible, onPipelineTick])

  const visibleSteps = stepsBeforeAnswer.slice(0, revealed)

  return { visibleSteps, answerVisible, skipPipeline }
}
