export const partTypes = {
  isTextPart(part) {
    return part.type === 'text'
  },
  
  isToolPart(part) {
    return part.type === 'tool'
  },
  
  isReasoningPart(part) {
    return part.type === 'reasoning'
  },
  
  isFilePart(part) {
    return part.type === 'file'
  },
  
  isAgentPart(part) {
    return part.type === 'agent'
  },
  
  isSubtaskPart(part) {
    return part.type === 'subtask'
  },
  
  isStepStartPart(part) {
    return part.type === 'step-start'
  },
  
  isStepFinishPart(part) {
    return part.type === 'step-finish'
  },
  
  isSnapshotPart(part) {
    return part.type === 'snapshot'
  },
  
  isPatchPart(part) {
    return part.type === 'patch'
  },
  
  isRetryPart(part) {
    return part.type === 'retry'
  },
  
  isCompactionPart(part) {
    return part.type === 'compaction'
  }
}

