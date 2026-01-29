import {
  partTypes
} from '../src/part-types.js'

describe('isTextPart', () => {
  test('returns true for text type', () => {
    expect(partTypes.isTextPart({ type: 'text' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isTextPart({ type: 'tool' })).toBe(false)
    expect(partTypes.isTextPart({ type: 'reasoning' })).toBe(false)
    expect(partTypes.isTextPart({})).toBe(false)
  })
})

describe('isToolPart', () => {
  test('returns true for tool type', () => {
    expect(partTypes.isToolPart({ type: 'tool' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isToolPart({ type: 'text' })).toBe(false)
    expect(partTypes.isToolPart({ type: 'reasoning' })).toBe(false)
    expect(partTypes.isToolPart({})).toBe(false)
  })
})

describe('isReasoningPart', () => {
  test('returns true for reasoning type', () => {
    expect(partTypes.isReasoningPart({ type: 'reasoning' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isReasoningPart({ type: 'text' })).toBe(false)
    expect(partTypes.isReasoningPart({ type: 'tool' })).toBe(false)
    expect(partTypes.isReasoningPart({})).toBe(false)
  })
})

describe('isFilePart', () => {
  test('returns true for file type', () => {
    expect(partTypes.isFilePart({ type: 'file' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isFilePart({ type: 'text' })).toBe(false)
    expect(partTypes.isFilePart({ type: 'tool' })).toBe(false)
    expect(partTypes.isFilePart({})).toBe(false)
  })
})

describe('isAgentPart', () => {
  test('returns true for agent type', () => {
    expect(partTypes.isAgentPart({ type: 'agent' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isAgentPart({ type: 'text' })).toBe(false)
    expect(partTypes.isAgentPart({ type: 'tool' })).toBe(false)
    expect(partTypes.isAgentPart({})).toBe(false)
  })
})

describe('isSubtaskPart', () => {
  test('returns true for subtask type', () => {
    expect(partTypes.isSubtaskPart({ type: 'subtask' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isSubtaskPart({ type: 'text' })).toBe(false)
    expect(partTypes.isSubtaskPart({ type: 'tool' })).toBe(false)
    expect(partTypes.isSubtaskPart({})).toBe(false)
  })
})

describe('isStepStartPart', () => {
  test('returns true for step-start type', () => {
    expect(partTypes.isStepStartPart({ type: 'step-start' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isStepStartPart({ type: 'text' })).toBe(false)
    expect(partTypes.isStepStartPart({ type: 'step-finish' })).toBe(false)
    expect(partTypes.isStepStartPart({})).toBe(false)
  })
})

describe('isStepFinishPart', () => {
  test('returns true for step-finish type', () => {
    expect(partTypes.isStepFinishPart({ type: 'step-finish' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isStepFinishPart({ type: 'text' })).toBe(false)
    expect(partTypes.isStepFinishPart({ type: 'step-start' })).toBe(false)
    expect(partTypes.isStepFinishPart({})).toBe(false)
  })
})

describe('isSnapshotPart', () => {
  test('returns true for snapshot type', () => {
    expect(partTypes.isSnapshotPart({ type: 'snapshot' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isSnapshotPart({ type: 'text' })).toBe(false)
    expect(partTypes.isSnapshotPart({ type: 'patch' })).toBe(false)
    expect(partTypes.isSnapshotPart({})).toBe(false)
  })
})

describe('isPatchPart', () => {
  test('returns true for patch type', () => {
    expect(partTypes.isPatchPart({ type: 'patch' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isPatchPart({ type: 'text' })).toBe(false)
    expect(partTypes.isPatchPart({ type: 'snapshot' })).toBe(false)
    expect(partTypes.isPatchPart({})).toBe(false)
  })
})

describe('isRetryPart', () => {
  test('returns true for retry type', () => {
    expect(partTypes.isRetryPart({ type: 'retry' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isRetryPart({ type: 'text' })).toBe(false)
    expect(partTypes.isRetryPart({ type: 'tool' })).toBe(false)
    expect(partTypes.isRetryPart({})).toBe(false)
  })
})

describe('isCompactionPart', () => {
  test('returns true for compaction type', () => {
    expect(partTypes.isCompactionPart({ type: 'compaction' })).toBe(true)
  })

  test('returns false for other types', () => {
    expect(partTypes.isCompactionPart({ type: 'text' })).toBe(false)
    expect(partTypes.isCompactionPart({ type: 'tool' })).toBe(false)
    expect(partTypes.isCompactionPart({})).toBe(false)
  })
})
