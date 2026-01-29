import {
  isDisconnected,
  isNotConnecting,
  getThinkingButtonText,
  showMainPanels,
  showEmptyState,
  isPromptDisabled,
  isSendDisabled,
  getTreePrefix
} from '../src/ui-helpers.js'

describe('isDisconnected', () => {
  test('returns true when connected is false', () => {
    expect(isDisconnected(false)).toBe(true)
  })

  test('returns false when connected is true', () => {
    expect(isDisconnected(true)).toBe(false)
  })
})

describe('isNotConnecting', () => {
  test('returns true when connecting is false', () => {
    expect(isNotConnecting(false)).toBe(true)
  })

  test('returns false when connecting is true', () => {
    expect(isNotConnecting(true)).toBe(false)
  })
})

describe('getThinkingButtonText', () => {
  test('returns "Hide Thinking" when showThinking is true', () => {
    expect(getThinkingButtonText(true)).toBe('Hide Thinking')
  })

  test('returns "Show Thinking" when showThinking is false', () => {
    expect(getThinkingButtonText(false)).toBe('Show Thinking')
  })
})

describe('showMainPanels', () => {
  test('returns true when connected and tree are both truthy', () => {
    expect(showMainPanels(true, { id: 'root' })).toBe(true)
  })

  test('returns false when connected but tree is null', () => {
    expect(showMainPanels(true, null)).toBe(false)
  })

  test('returns false when not connected but tree exists', () => {
    expect(showMainPanels(false, { id: 'root' })).toBe(false)
  })

  test('returns false when neither connected nor tree', () => {
    expect(showMainPanels(false, null)).toBe(false)
  })
})

describe('showEmptyState', () => {
  test('returns true when connected but no tree and no session selected (null)', () => {
    expect(showEmptyState(true, null, null)).toBe(true)
  })

  test('returns true when connected but no tree and empty session selected', () => {
    expect(showEmptyState(true, null, '')).toBe(true)
  })

  test('returns false when not connected', () => {
    expect(showEmptyState(false, null, null)).toBe(false)
  })

  test('returns false when has tree', () => {
    expect(showEmptyState(true, { id: 'root' }, null)).toBe(false)
  })

  test('returns false when has session selected', () => {
    expect(showEmptyState(true, null, 'sess-1')).toBe(false)
  })

  test('returns false when has both tree and session selected', () => {
    expect(showEmptyState(true, { id: 'root' }, 'sess-1')).toBe(false)
  })
})

describe('isPromptDisabled', () => {
  test('returns true when selectedNodeId is null', () => {
    expect(isPromptDisabled(null)).toBe(true)
  })

  test('returns true when selectedNodeId is empty string', () => {
    expect(isPromptDisabled('')).toBe(true)
  })

  test('returns false when selectedNodeId has value', () => {
    expect(isPromptDisabled('node-1')).toBe(false)
  })
})

describe('isSendDisabled', () => {
  test('returns true when selectedNodeId is null', () => {
    expect(isSendDisabled(null, 'hello')).toBe(true)
  })

  test('returns true when promptInput is empty string', () => {
    expect(isSendDisabled('node-1', '')).toBe(true)
  })

  test('returns true when promptInput is null', () => {
    expect(isSendDisabled('node-1', null)).toBe(true)
  })

  test('returns true when both selectedNodeId and promptInput are empty', () => {
    expect(isSendDisabled(null, '')).toBe(true)
  })

  test('returns false when both selectedNodeId and promptInput have values', () => {
    expect(isSendDisabled('node-1', 'hello')).toBe(false)
  })
})

describe('getTreePrefix', () => {
  test('returns empty string for depth 0 (root)', () => {
    expect(getTreePrefix(0, false, [])).toBe('')
  })

  test('returns "├─ " for depth 1, not last', () => {
    expect(getTreePrefix(1, false, [])).toBe('├─ ')
  })

  test('returns "└─ " for depth 1, last child', () => {
    expect(getTreePrefix(1, true, [])).toBe('└─ ')
  })

  test('returns "│  ├─ " for depth 2, not last, ancestor continues', () => {
    expect(getTreePrefix(2, false, [true])).toBe('│  ├─ ')
  })

  test('returns "│  └─ " for depth 2, last, ancestor continues', () => {
    expect(getTreePrefix(2, true, [true])).toBe('│  └─ ')
  })

  test('returns "   ├─ " for depth 2, not last, ancestor ended', () => {
    expect(getTreePrefix(2, false, [false])).toBe('   ├─ ')
  })

  test('returns "   └─ " for depth 2, last, ancestor ended', () => {
    expect(getTreePrefix(2, true, [false])).toBe('   └─ ')
  })
})
