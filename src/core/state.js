import { addNode, findNode, getParentId } from './tree.js'

export function handleSessionCreated(state, event) {
  state.sessions = [...state.sessions, event.info]
  if (state.tree && findNode(state.tree, getParentId(event.info))) {
    addNode(state.tree, event.info)
  }
  return state
}

export function handlePartUpdated(state, event) {
  if (event.part.sessionID !== state.selectedNodeId) return state
  let message = state.messages.find(m => m.id === event.part.messageID)
  if (!message) {
    message = { id: event.part.messageID, role: 'assistant', parts: [] }
    state.messages.push(message)
  }
  let part = message.parts.find(p => p.id === event.part.id)
  if (!part) {
    part = { ...event.part }
    message.parts.push(part)
  }
  const partIndex = message.parts.indexOf(part)
  let updatedPart = { ...part, ...event.part }
  if (event.delta) {
    if (part.type === 'reasoning') {
      updatedPart.text = (part.text || '') + event.delta
    } else {
      updatedPart.content = (part.content || '') + event.delta
    }
  } else if (!part.content && event.part.text) {
    updatedPart.content = event.part.text
  }
  message.parts[partIndex] = updatedPart
  const messageIndex = state.messages.indexOf(message)
  state.messages[messageIndex] = { ...message, parts: [...message.parts] }
  state.messages = [...state.messages]
  return state
}

export function handleMessageUpdated(state, event) {
  if (event.info.sessionID !== state.selectedNodeId) return state
  let message = state.messages.find(m => m.id === event.info.id)
  if (!message) {
    message = { id: event.info.id, role: event.info.role, parts: [] }
    state.messages.push(message)
  } else {
    message.role = event.info.role
  }
  state.messages = [...state.messages]
  return state
}

export function handleSessionUpdated(state, event) {
  const node = findNode(state.tree, event.info.id)
  node.title = event.info.title
  state.tree = { ...state.tree }
  return state
}

export function handleSessionStatus(state, event) {
  const node = findNode(state.tree, event.sessionID)
  node.status = event.status
  state.tree = { ...state.tree }
  return state
}
