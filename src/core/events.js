export function parseEvent(raw) {
  return JSON.parse(raw)
}

export function createEventHandlers(callbacks) {
  return {
    'message.part.updated': (event) => callbacks.onPartUpdated(event),
    'session.created': (event) => callbacks.onSessionCreated(event),
    'session.updated': (event) => callbacks.onSessionUpdated(event),
    'session.status': (event) => callbacks.onSessionStatus(event)
  }
}
