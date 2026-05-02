import React from 'react'
import { FinalAnswerRow, PipelineSteps } from './AssistantParts'
import { useAssistantPipeline } from './hooks/useAssistantPipeline'
import { routePillClass } from './utils'

/**
 * One assistant turn: orchestration steps (staggered) then final answer.
 */
export function AssistantTurnBlock({ msg, onPipelineTick }) {
  const { visibleSteps, answerVisible } = useAssistantPipeline(msg.pipelineTrace, onPipelineTick)

  return (
    <div className="assistant-turn">
      <PipelineSteps steps={visibleSteps} />
      {answerVisible ? <FinalAnswerRow content={msg.content} meta={msg.meta} routePillClass={routePillClass} /> : null}
    </div>
  )
}
