import {
  filterSessions,
  isSessionSelected,
  hasNoFilteredSessions
} from '../src/session-helpers.js'

describe('filterSessions', () => {
  test('returns all sessions when query is empty', () => {
    const sessions = [
      { id: 's1', title: 'First' },
      { id: 's2', title: 'Second' }
    ]
    expect(filterSessions(sessions, '')).toEqual(sessions)
  })

  test('filters sessions by title case-insensitive', () => {
    const sessions = [
      { id: 's1', title: 'First Session' },
      { id: 's2', title: 'Second Session' },
      { id: 's3', title: 'Another' }
    ]
    
    const result = filterSessions(sessions, 'FIRST')
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('s1')
  })

  test('filters sessions by id case-insensitive', () => {
    const sessions = [
      { id: 'abc-123', title: 'One' },
      { id: 'xyz-456', title: 'Two' },
      { id: 'ABC-789', title: 'Three' }
    ]
    
    const result = filterSessions(sessions, 'abc')
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('abc-123')
    expect(result[1].id).toBe('ABC-789')
  })

  test('returns empty array when no matches', () => {
    const sessions = [
      { id: 's1', title: 'First' },
      { id: 's2', title: 'Second' }
    ]
    
    expect(filterSessions(sessions, 'nomatch')).toEqual([])
  })
})

describe('isSessionSelected', () => {
  test('returns true when session.id matches selectedSessionId', () => {
    expect(isSessionSelected({ id: 'sess-1' }, 'sess-1')).toBe(true)
  })

  test('returns false when session.id does not match selectedSessionId', () => {
    expect(isSessionSelected({ id: 'sess-1' }, 'sess-2')).toBe(false)
  })

  test('returns false when selectedSessionId is null', () => {
    expect(isSessionSelected({ id: 'sess-1' }, null)).toBe(false)
  })
})

describe('hasNoFilteredSessions', () => {
  test('returns true when array is empty', () => {
    expect(hasNoFilteredSessions([])).toBe(true)
  })

  test('returns false when array has sessions', () => {
    expect(hasNoFilteredSessions([{ id: 'sess-1' }])).toBe(false)
  })
})
