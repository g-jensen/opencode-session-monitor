import * as partTypes from './part-types.js'

export function shouldShowPart(part, showThinking) {
  if (part.type === 'reasoning') return showThinking
  return true
}

export function shouldShowReasoningPart(part, showThinking) {
  return partTypes.isReasoningPart(part) && showThinking
}

export function getTaskSessionId(part) {
  if (part.tool !== 'task') return undefined
  return part.state?.metadata?.sessionId
}

export function isClickableTaskPart(part) {
  return part.tool === 'task' && !!this.getTaskSessionId(part)
}

export function getAgentDisplay(part) {
  return part.name ? `Skill: ${part.name}` : 'Skill'
}

export function getReasoningDisplay(part) {
  return part.text || ''
}

export function getFileDisplay(part) {
  return part.filename || part.url || 'File'
}

export function getSubtaskDisplay(part) {
  if (!part.description) return 'Subtask'
  if (part.agent) return `Subtask [${part.agent}]: ${part.description}`
  return `Subtask: ${part.description}`
}

export function getRetryDisplay(part) {
  return `Retry attempt ${part.attempt}`
}

export function getPatchDisplay(part) {
  const count = part.files?.length || 0
  return `Patch: ${count} files`
}