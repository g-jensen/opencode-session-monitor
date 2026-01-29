import { partTypes } from './part-types.js'

export const partDisplay = {
  shouldShowPart(part, showThinking) {
    if (part.type === 'reasoning') return showThinking
    return true
  },
  
  shouldShowReasoningPart(part, showThinking) {
    return partTypes.isReasoningPart(part) && showThinking
  },
  
  getTaskSessionId(part) {
    if (part.tool !== 'task') return undefined
    return part.state?.metadata?.sessionId
  },
  
  isClickableTaskPart(part) {
    return part.tool === 'task' && !!this.getTaskSessionId(part)
  },
  
  getAgentDisplay(part) {
    return part.name ? `Skill: ${part.name}` : 'Skill'
  },
  
  getReasoningDisplay(part) {
    return part.text || ''
  },
  
  getFileDisplay(part) {
    return part.filename || part.url || 'File'
  },
  
  getSubtaskDisplay(part) {
    if (!part.description) return 'Subtask'
    if (part.agent) return `Subtask [${part.agent}]: ${part.description}`
    return `Subtask: ${part.description}`
  },
  
  getRetryDisplay(part) {
    return `Retry attempt ${part.attempt}`
  },
  
  getPatchDisplay(part) {
    const count = part.files?.length || 0
    return `Patch: ${count} files`
  },
}

