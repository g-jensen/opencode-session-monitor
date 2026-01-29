export function filterSessions(sessions, query) {
  if (!query) return sessions
  const q = query.toLowerCase()
  return sessions.filter(s => 
    (s.title?.toLowerCase().includes(q)) || 
    (s.id?.toLowerCase().includes(q))
  )
}

export function isSessionSelected(session, selectedSessionId) {
  return session.id === selectedSessionId
}

export function hasNoFilteredSessions(filteredSessions) {
  return filteredSessions.length === 0
}
