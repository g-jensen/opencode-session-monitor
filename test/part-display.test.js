import {
  partDisplay
} from '../src/part-display.js'

describe('getAgentDisplay', () => {
  test('returns "Skill: {name}" for agent part with name', () => {
    expect(partDisplay.getAgentDisplay({ type: 'agent', name: 'golang' })).toBe('Skill: golang')
  })

  test('returns "Skill" for agent part without name', () => {
    expect(partDisplay.getAgentDisplay({ type: 'agent' })).toBe('Skill')
  })
})

describe('getReasoningDisplay', () => {
  test('returns the text from part.text', () => {
    expect(partDisplay.getReasoningDisplay({ type: 'reasoning', text: 'thinking about this' })).toBe('thinking about this')
  })

  test('returns empty string if no text', () => {
    expect(partDisplay.getReasoningDisplay({ type: 'reasoning' })).toBe('')
  })
})

describe('getFileDisplay', () => {
  test('returns filename when present', () => {
    expect(partDisplay.getFileDisplay({ type: 'file', filename: 'report.pdf', url: 'https://example.com/report.pdf' })).toBe('report.pdf')
  })

  test('returns url when filename missing', () => {
    expect(partDisplay.getFileDisplay({ type: 'file', url: 'https://example.com/report.pdf' })).toBe('https://example.com/report.pdf')
  })

  test('returns "File" when both missing', () => {
    expect(partDisplay.getFileDisplay({ type: 'file' })).toBe('File')
  })
})

describe('getSubtaskDisplay', () => {
  test('returns "Subtask [{agent}]: {description}" when both present', () => {
    expect(partDisplay.getSubtaskDisplay({ type: 'subtask', agent: 'red', description: 'Write test' })).toBe('Subtask [red]: Write test')
  })

  test('returns "Subtask: {description}" when no agent', () => {
    expect(partDisplay.getSubtaskDisplay({ type: 'subtask', description: 'Analyze code' })).toBe('Subtask: Analyze code')
  })

  test('returns "Subtask" when no description', () => {
    expect(partDisplay.getSubtaskDisplay({ type: 'subtask' })).toBe('Subtask')
  })
})

describe('getRetryDisplay', () => {
  test('returns "Retry attempt {attempt}" for retry part', () => {
    expect(partDisplay.getRetryDisplay({ type: 'retry', attempt: 3 })).toBe('Retry attempt 3')
  })
})

describe('getPatchDisplay', () => {
  test('returns "Patch: {n} files" based on files array length', () => {
    expect(partDisplay.getPatchDisplay({ type: 'patch', hash: 'abc123', files: ['a.js', 'b.js', 'c.js'] })).toBe('Patch: 3 files')
  })

  test('returns "Patch: 0 files" when files empty or missing', () => {
    expect(partDisplay.getPatchDisplay({ type: 'patch', hash: 'abc123', files: [] })).toBe('Patch: 0 files')
    expect(partDisplay.getPatchDisplay({ type: 'patch', hash: 'abc123' })).toBe('Patch: 0 files')
  })
})

describe('shouldShowPart', () => {
  test('returns false for reasoning part when showThinking is false', () => {
    expect(partDisplay.shouldShowPart({ type: 'reasoning' }, false)).toBe(false)
  })

  test('returns true for reasoning part when showThinking is true', () => {
    expect(partDisplay.shouldShowPart({ type: 'reasoning' }, true)).toBe(true)
  })

  test('returns true for text part regardless of showThinking', () => {
    expect(partDisplay.shouldShowPart({ type: 'text' }, false)).toBe(true)
    expect(partDisplay.shouldShowPart({ type: 'text' }, true)).toBe(true)
  })

  test('returns true for tool part regardless of showThinking', () => {
    expect(partDisplay.shouldShowPart({ type: 'tool' }, false)).toBe(true)
    expect(partDisplay.shouldShowPart({ type: 'tool' }, true)).toBe(true)
  })
})

describe('getTaskSessionId', () => {
  test('returns sessionId for task part with metadata.sessionId', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {
        status: 'running',
        metadata: {
          sessionId: 'ses_child123'
        }
      }
    }
    expect(partDisplay.getTaskSessionId(part)).toBe('ses_child123')
  })

  test('returns undefined for task part without metadata', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {
        status: 'running'
      }
    }
    expect(partDisplay.getTaskSessionId(part)).toBeUndefined()
  })

  test('returns undefined for non-task part', () => {
    const part = {
      type: 'tool',
      tool: 'bash',
      state: {
        metadata: {
          sessionId: 'ses_child123'
        }
      }
    }
    expect(partDisplay.getTaskSessionId(part)).toBeUndefined()
  })
})

describe('isClickableTaskPart', () => {
  test('returns true for task part with sessionId', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {
        metadata: {
          sessionId: 'ses_child123'
        }
      }
    }
    expect(partDisplay.isClickableTaskPart(part)).toBe(true)
  })

  test('returns false for task part without sessionId', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {
        status: 'running'
      }
    }
    expect(partDisplay.isClickableTaskPart(part)).toBe(false)
  })

  test('returns false for non-task tool part', () => {
    const part = {
      type: 'tool',
      tool: 'bash',
      state: {
        metadata: {
          sessionId: 'ses_child123'
        }
      }
    }
    expect(partDisplay.isClickableTaskPart(part)).toBe(false)
  })

  test('returns false for non-tool part', () => {
    const part = {
      type: 'text',
      content: 'hello'
    }
    expect(partDisplay.isClickableTaskPart(part)).toBe(false)
  })
})

describe('shouldShowReasoningPart', () => {
  test('returns true for reasoning part when showThinking is true', () => {
    expect(partDisplay.shouldShowReasoningPart({ type: 'reasoning' }, true)).toBe(true)
  })

  test('returns false for reasoning part when showThinking is false', () => {
    expect(partDisplay.shouldShowReasoningPart({ type: 'reasoning' }, false)).toBe(false)
  })

  test('returns false for text part when showThinking is true', () => {
    expect(partDisplay.shouldShowReasoningPart({ type: 'text' }, true)).toBe(false)
  })

  test('returns false for text part when showThinking is false', () => {
    expect(partDisplay.shouldShowReasoningPart({ type: 'text' }, false)).toBe(false)
  })
})
