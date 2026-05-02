import { useEffect, useMemo, useState } from 'react'
import { ANSWER_EXTRA_DELAY_MS, FIRST_STEP_DELAY_MS, STEP_REVEAL_MS } from '../constants'

const STEPS_EXCLUDE_FINAL = (trace) =>
  Array.isArray(trace) ? trace.filter((s) => s?.id && s.id !== 'response_agent') : []

export function useAssistantPipeline(trace, onPipelineTick) {
  const stepsBeforeAnswer = useMemo(() => STEPS_EXCLUDE_FINAL(trace), [trace])
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
  }, [skipPipeline, trace, stepsBeforeAnswer.length])

  useEffect(() => {
    onPipelineTick?.()
  }, [revealed, answerVisible, onPipelineTick])

  const visibleSteps = stepsBeforeAnswer.slice(0, revealed)

  return { visibleSteps, answerVisible, skipPipeline }
}
