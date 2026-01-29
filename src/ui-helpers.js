export function isDisconnected(connected) {
  return !connected
}

export function isNotConnecting(connecting) {
  return !connecting
}

export function getThinkingButtonText(showThinking) {
  return showThinking ? 'Hide Thinking' : 'Show Thinking'
}

export function showMainPanels(connected, tree) {
  return connected && !!tree
}

export function showEmptyState(connected, tree, selectedSessionId) {
  return connected && !tree && !selectedSessionId
}

export function isPromptDisabled(selectedNodeId) {
  return !selectedNodeId
}

export function isSendDisabled(selectedNodeId, promptInput) {
  return !selectedNodeId || !promptInput
}

export function getTreePrefix(depth, isLast, ancestorContinues) {
  if (depth === 0) return ''
  
  let prefix = ''
  
  for (let i = 0; i < depth - 1; i++) {
    prefix += ancestorContinues[i] ? '│  ' : '   '
  }
  
  prefix += isLast ? '└─ ' : '├─ '
  
  return prefix
}
