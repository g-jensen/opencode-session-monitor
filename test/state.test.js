import { handleMessageUpdated, handlePartUpdated, handleSessionCreated, handleSessionStatus, handleSessionUpdated } from '../src/core/state.js'

describe('handlePartUpdated', () => {
  test('appends delta to matching part content', () => {
    const state = {
      selectedNodeId: 'sess1',
      messages: [
        {
          id: 'msg1',
          parts: [
            { id: 'part1', sessionID: 'sess1', content: 'Hello' }
          ]
        }
      ]
    }
    const event = {
      part: { id: 'part1', sessionID: 'sess1', messageID: 'msg1' },
      delta: ' World'
    }

    const result = handlePartUpdated(state, event)

    expect(result.messages[0].parts[0].content).toBe('Hello World')
  })

  test('does not update when sessionID does not match selectedNodeId', () => {
    const state = {
      selectedNodeId: 'different-session',
      messages: [
        {
          id: 'msg1',
          parts: [
            { id: 'part1', sessionID: 'sess1', content: 'Hello' }
          ]
        }
      ]
    }
    const event = {
      part: { id: 'part1', sessionID: 'sess1', messageID: 'msg1' },
      delta: ' World'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].content).toBe('Hello')
  })

  test('reassigns messages array for reactivity', () => {
    const originalMessages = [
      { id: 'msg-1', parts: [{ id: 'part-1', content: 'Hello' }] }
    ]
    const state = {
      selectedNodeId: 'session-1',
      messages: originalMessages
    }
    const event = {
      part: { sessionID: 'session-1', messageID: 'msg-1', id: 'part-1' },
      delta: ' world'
    }

    handlePartUpdated(state, event)

    expect(state.messages).not.toBe(originalMessages)
    expect(state.messages[0].parts[0].content).toBe('Hello world')
  })

  test('creates message if it does not exist', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: {
        sessionID: 'session-1',
        messageID: 'msg-new',
        id: 'part-1',
        role: 'assistant'
      },
      delta: 'Hello'
    }

    handlePartUpdated(state, event)

    expect(state.messages).toHaveLength(1)
    expect(state.messages[0].id).toBe('msg-new')
    expect(state.messages[0].role).toBe('assistant')
    expect(state.messages[0].parts[0].content).toBe('Hello')
  })

  test('creates part if it does not exist on existing message', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: [
        { id: 'msg-1', role: 'assistant', parts: [{ id: 'part-1', content: 'First' }] }
      ]
    }
    const event = {
      part: { 
        sessionID: 'session-1', 
        messageID: 'msg-1', 
        id: 'part-2'
      },
      delta: 'Second'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts).toHaveLength(2)
    expect(state.messages[0].parts[1].id).toBe('part-2')
    expect(state.messages[0].parts[1].content).toBe('Second')
  })

  test('copies type from event part when creating new part', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: { 
        sessionID: 'session-1', 
        messageID: 'msg-1', 
        id: 'part-1',
        type: 'text',
        role: 'assistant'
      },
      delta: 'Hello'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].type).toBe('text')
  })

  test('creates new part object reference for reactivity', () => {
    const originalPart = { id: 'part-1', content: 'Hello' }
    const originalMessage = { id: 'msg-1', parts: [originalPart] }
    const state = {
      selectedNodeId: 'session-1',
      messages: [originalMessage]
    }
    const event = {
      part: { sessionID: 'session-1', messageID: 'msg-1', id: 'part-1' },
      delta: ' world'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0]).not.toBe(originalPart)
    expect(state.messages[0].parts[0].content).toBe('Hello world')
  })

  test('creates new message object reference for reactivity', () => {
    const originalMessage = { id: 'msg-1', parts: [{ id: 'part-1', content: 'Hello' }] }
    const state = {
      selectedNodeId: 'session-1',
      messages: [originalMessage]
    }
    const event = {
      part: { sessionID: 'session-1', messageID: 'msg-1', id: 'part-1' },
      delta: ' world'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0]).not.toBe(originalMessage)
    expect(state.messages[0].parts[0].content).toBe('Hello world')
  })

  test('uses event.part.text as content when delta is undefined', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: { 
        sessionID: 'session-1', 
        messageID: 'msg-1', 
        id: 'part-1',
        type: 'text',
        text: 'Hello world',
        role: 'assistant'
      }
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].content).toBe('Hello world')
  })

  test('does not duplicate content when event has text but no delta on existing part', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: [
        { id: 'msg-1', parts: [{ id: 'part-1', type: 'text', content: 'Hello' }] }
      ]
    }
    const event = {
      part: { 
        sessionID: 'session-1', 
        messageID: 'msg-1', 
        id: 'part-1',
        type: 'text',
        text: 'Hello'
      }
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].content).toBe('Hello')
  })

  test('defaults to assistant role when event part has no role', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: { 
        sessionID: 'session-1', 
        messageID: 'msg-1', 
        id: 'part-1',
        type: 'text'
      },
      delta: 'Hello'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].role).toBe('assistant')
  })

  test('spreads all event.part properties onto new reasoning part', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: {
        id: 'part-1',
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'reasoning',
        text: 'thinking about the problem...',
        role: 'assistant'
      }
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].type).toBe('reasoning')
    expect(state.messages[0].parts[0].text).toBe('thinking about the problem...')
  })

  test('spreads all event.part properties onto new tool part', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: {
        id: 'part-1',
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'tool',
        callID: 'call-123',
        tool: 'task',
        state: { status: 'pending', input: { task: 'do something' } },
        role: 'assistant'
      }
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].type).toBe('tool')
    expect(state.messages[0].parts[0].tool).toBe('task')
    expect(state.messages[0].parts[0].callID).toBe('call-123')
    expect(state.messages[0].parts[0].state).toEqual({ status: 'pending', input: { task: 'do something' } })
  })

  test('spreads all event.part properties onto new agent part', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      part: {
        id: 'part-1',
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'agent',
        name: 'golang',
        role: 'assistant'
      }
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].type).toBe('agent')
    expect(state.messages[0].parts[0].name).toBe('golang')
  })

  test('updates existing tool part with new state properties', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          parts: [
            {
              id: 'part-1',
              type: 'tool',
              callID: 'call-123',
              tool: 'task',
              state: { status: 'pending' }
            }
          ]
        }
      ]
    }
    const event = {
      part: {
        id: 'part-1',
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'tool',
        callID: 'call-123',
        tool: 'task',
        state: { status: 'running', output: 'in progress' }
      }
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].state).toEqual({ status: 'running', output: 'in progress' })
  })

  test('appends delta to content field for text parts', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          parts: [{ id: 'part-1', type: 'text', content: 'Hello' }]
        }
      ]
    }
    const event = {
      part: { id: 'part-1', sessionID: 'session-1', messageID: 'msg-1', type: 'text' },
      delta: ' World'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].content).toBe('Hello World')
  })

  test('appends delta to text field for reasoning parts', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          parts: [{ id: 'part-1', type: 'reasoning', text: 'Thinking' }]
        }
      ]
    }
    const event = {
      part: { id: 'part-1', sessionID: 'session-1', messageID: 'msg-1', type: 'reasoning' },
      delta: ' more deeply'
    }

    handlePartUpdated(state, event)

    expect(state.messages[0].parts[0].text).toBe('Thinking more deeply')
  })
})

describe('handleSessionCreated', () => {
  test('adds session info to sessions list', () => {
    const state = {
      sessions: [],
      tree: { id: 'root', title: 'Root', children: [] }
    }
    const event = {
      info: { id: 'child1', parentID: 'root', title: 'New Child' }
    }

    const result = handleSessionCreated(state, event)

    expect(result.sessions).toContainEqual({ id: 'child1', parentID: 'root', title: 'New Child' })
  })

  test('adds node to tree when parent exists', () => {
    const state = {
      sessions: [],
      tree: { id: 'root', title: 'Root', children: [] }
    }
    const event = {
      info: { id: 'child1', parentID: 'root', title: 'New Child' }
    }

    handleSessionCreated(state, event)

    expect(state.tree.children).toHaveLength(1)
    expect(state.tree.children[0].id).toBe('child1')
  })

  test('reassigns sessions array for reactivity', () => {
    const originalSessions = [{ id: 'session-1' }]
    const state = {
      sessions: originalSessions,
      tree: null
    }
    const event = {
      info: { id: 'session-2', parentId: null }
    }

    handleSessionCreated(state, event)

    expect(state.sessions).not.toBe(originalSessions)
    expect(state.sessions).toHaveLength(2)
  })
})

describe('handleSessionUpdated', () => {
  test('updates title of matching node in tree', () => {
    const state = {
      tree: { id: 'sess1', title: 'Old Title', children: [] }
    }
    const event = {
      info: { id: 'sess1', title: 'New Title' }
    }

    handleSessionUpdated(state, event)

    expect(state.tree.title).toBe('New Title')
  })

  test('reassigns tree for reactivity', () => {
    const originalTree = { id: 'session-1', title: 'Old', children: [] }
    const state = { tree: originalTree }
    const event = { info: { id: 'session-1', title: 'New' } }

    handleSessionUpdated(state, event)

    expect(state.tree).not.toBe(originalTree)
    expect(state.tree.title).toBe('New')
  })
})

describe('handleSessionStatus', () => {
  test('updates status of matching node in tree', () => {
    const state = {
      tree: { id: 'sess1', title: 'Session', status: 'idle', children: [] }
    }
    const event = {
      sessionID: 'sess1',
      status: 'busy'
    }

    handleSessionStatus(state, event)

    expect(state.tree.status).toBe('busy')
  })

  test('reassigns tree for reactivity', () => {
    const originalTree = { id: 'session-1', status: 'idle', children: [] }
    const state = { tree: originalTree }
    const event = { sessionID: 'session-1', status: 'busy' }

    handleSessionStatus(state, event)

    expect(state.tree).not.toBe(originalTree)
    expect(state.tree.status).toBe('busy')
  })
})

describe('handleMessageUpdated', () => {
  test('updates message role from event info', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: [
        { id: 'msg-1', role: 'assistant', parts: [] }
      ]
    }
    const event = {
      info: { 
        id: 'msg-1',
        sessionID: 'session-1',
        role: 'user'
      }
    }

    handleMessageUpdated(state, event)

    expect(state.messages[0].role).toBe('user')
  })

  test('creates message if it does not exist', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const event = {
      info: {
        id: 'msg-1',
        sessionID: 'session-1',
        role: 'user'
      }
    }

    handleMessageUpdated(state, event)

    expect(state.messages).toHaveLength(1)
    expect(state.messages[0].id).toBe('msg-1')
    expect(state.messages[0].role).toBe('user')
    expect(state.messages[0].parts).toEqual([])
  })

  test('message role is preserved when message.updated arrives before message.part.updated', () => {
    const state = {
      selectedNodeId: 'session-1',
      messages: []
    }
    const messageUpdatedEvent = {
      info: {
        id: 'msg-1',
        sessionID: 'session-1',
        role: 'user'
      }
    }
    const partUpdatedEvent = {
      part: {
        id: 'part-1',
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'text'
      },
      delta: 'Hello from user'
    }

    handleMessageUpdated(state, messageUpdatedEvent)
    handlePartUpdated(state, partUpdatedEvent)

    expect(state.messages[0].role).toBe('user')
  })
})
