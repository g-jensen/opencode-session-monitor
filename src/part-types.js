export function isTextPart(part) {
  return part.type === 'text'
}

export function isToolPart(part) {
  return part.type === 'tool'
}

export function isReasoningPart(part) {
  return part.type === 'reasoning'
}

export function isFilePart(part) {
  return part.type === 'file'
}

export function isAgentPart(part) {
  return part.type === 'agent'
}

export function isSubtaskPart(part) {
  return part.type === 'subtask'
}

export function isStepStartPart(part) {
  return part.type === 'step-start'
}

export function isStepFinishPart(part) {
  return part.type === 'step-finish'
}

export function isSnapshotPart(part) {
  return part.type === 'snapshot'
}

export function isPatchPart(part) {
  return part.type === 'patch'
}

export function isRetryPart(part) {
  return part.type === 'retry'
}

export function isCompactionPart(part) {
  return part.type === 'compaction'
}