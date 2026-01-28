import { parseEvent, createEventHandlers } from '../src/core/events.js'

describe('parseEvent', () => {
  test('parses JSON string into object', () => {
    const raw = '{"part": {"type": "text"}, "delta": "hello"}'

    const result = parseEvent(raw)

    expect(result).toEqual({ part: { type: 'text' }, delta: 'hello' })
  })
})

describe('createEventHandlers', () => {
  test('message.part.updated handler calls onPartUpdated with event data', () => {
    const callbacks = { onPartUpdated: vi.fn() }

    const handlers = createEventHandlers(callbacks)
    handlers['message.part.updated']({ part: { type: 'text' }, delta: 'hi' })

    expect(callbacks.onPartUpdated).toHaveBeenCalledWith({ part: { type: 'text' }, delta: 'hi' })
  })

  test('session.created handler calls onSessionCreated with event data', () => {
    const callbacks = { onSessionCreated: vi.fn() }

    const handlers = createEventHandlers(callbacks)
    handlers['session.created']({ info: { id: 'sess1', title: 'New Session' } })

    expect(callbacks.onSessionCreated).toHaveBeenCalledWith({ info: { id: 'sess1', title: 'New Session' } })
  })

  test('session.updated handler calls onSessionUpdated with event data', () => {
    const callbacks = { onSessionUpdated: vi.fn() }

    const handlers = createEventHandlers(callbacks)
    handlers['session.updated']({ info: { id: 'sess1', title: 'Updated Title' } })

    expect(callbacks.onSessionUpdated).toHaveBeenCalledWith({ info: { id: 'sess1', title: 'Updated Title' } })
  })

  test('session.status handler calls onSessionStatus with event data', () => {
    const callbacks = { onSessionStatus: vi.fn() }

    const handlers = createEventHandlers(callbacks)
    handlers['session.status']({ sessionID: 'sess1', status: 'busy' })

    expect(callbacks.onSessionStatus).toHaveBeenCalledWith({ sessionID: 'sess1', status: 'busy' })
  })
})
