vi.hoisted(() => {
  globalThis.window = {}
})

import {
  app as createApp
} from '../src/app.js'

const app = (deps = {}) => createApp({ 
  scrollMessagesToBottom: vi.fn(),
  getScrollPosition: vi.fn(() => 0),
  setScrollPosition: vi.fn(),
  ...deps 
})

describe('app', () => {
  describe('swapPanels', () => {
    test('toggles panelsSwapped from false to true to false', () => {
      const appInstance = app()

      expect(appInstance.panelsSwapped).toBe(false)

      appInstance.swapPanels()
      expect(appInstance.panelsSwapped).toBe(true)

      appInstance.swapPanels()
      expect(appInstance.panelsSwapped).toBe(false)
    })
  })

  describe('rootSessions', () => {
    test('filters to only sessions without parentID', () => {
      const appInstance = app()
      appInstance.sessions = [
        { id: 'root-1', title: 'Root 1' },
        { id: 'child-1', parentID: 'root-1', title: 'Child 1' },
        { id: 'root-2', title: 'Root 2', parentID: null },
        { id: 'child-2', parentId: 'root-2', title: 'Child 2' }
      ]

      expect(appInstance.rootSessions).toHaveLength(2)
      expect(appInstance.rootSessions[0].id).toBe('root-1')
      expect(appInstance.rootSessions[1].id).toBe('root-2')
    })
  })

  describe('connect', () => {
    test('calls API and updates state on success', async () => {
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.2.3' }),
        fetchSessions: vi.fn().mockResolvedValue([{ id: 's1', title: 'Session 1' }])
      }
      const mockCreateApiClient = vi.fn().mockReturnValue(mockApi)
      const MockEventSource = vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        close: vi.fn()
      }))

      const appInstance = app({
        createApiClient: mockCreateApiClient,
        EventSource: MockEventSource
      })

      await appInstance.connect()

      expect(appInstance.connected).toBe(true)
      expect(appInstance.version).toBe('1.2.3')
      expect(appInstance.sessions).toEqual([{ id: 's1', title: 'Session 1' }])
      expect(mockCreateApiClient).toHaveBeenCalledWith('http://localhost:4096', { apiKey: null })
    })

    test('sets error on API failure', async () => {
      const mockCreateApiClient = vi.fn().mockReturnValue({
        fetchHealth: vi.fn().mockRejectedValue(new Error('Connection failed'))
      })

      const appInstance = app({ createApiClient: mockCreateApiClient })

      await appInstance.connect()

      expect(appInstance.connected).toBe(false)
      expect(appInstance.error).toBe('Connection failed')
      expect(appInstance.connecting).toBe(false)
    })

    test('fetches and sets agents on connect', async () => {
      const mockConfig = {agent: {"build": {disable: false}, "plan": {disable: true}}}
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchProviders: vi.fn().mockResolvedValue({ all: [], connected: [] }),
        fetchConfig: vi.fn().mockResolvedValue(mockConfig)
      }
      const mockCreateApiClient = vi.fn().mockReturnValue(mockApi)
      const MockEventSource = vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        close: vi.fn()
      }))

      const appInstance = app({
        createApiClient: mockCreateApiClient,
        EventSource: MockEventSource
      })

      await appInstance.connect()

      expect(mockApi.fetchConfig).toHaveBeenCalled()
      expect(appInstance.agents).toEqual(["build"])
      expect(appInstance.selectedAgent).toEqual("build")
    })

    test('fetches and sets providers on connect', async () => {
      const mockProviders = { all: ['anthropic', 'openai'], connected: ['anthropic'] }
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchAgents: vi.fn().mockResolvedValue([]),
        fetchProviders: vi.fn().mockResolvedValue(mockProviders)
      }
      const mockCreateApiClient = vi.fn().mockReturnValue(mockApi)
      const MockEventSource = vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        close: vi.fn()
      }))

      const appInstance = app({
        createApiClient: mockCreateApiClient,
        EventSource: MockEventSource
      })

      await appInstance.connect()

      expect(mockApi.fetchProviders).toHaveBeenCalled()
      expect(appInstance.providers).toEqual(mockProviders)
    })

    test('handles empty agents array without crashing', async () => {
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchAgents: vi.fn().mockResolvedValue([]),
        fetchProviders: vi.fn().mockResolvedValue({ all: [], connected: [] })
      }
      const mockCreateApiClient = vi.fn().mockReturnValue(mockApi)
      const MockEventSource = vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        close: vi.fn()
      }))

      const appInstance = app({
        createApiClient: mockCreateApiClient,
        EventSource: MockEventSource
      })

      await appInstance.connect()

      expect(appInstance.connected).toBe(true)
      expect(appInstance.agents).toEqual([])
      expect(appInstance.selectedAgent).toBe('')
    })

    test('fetches config and sets selectedModel to active model', async () => {
      const mockConfig = { model: 'anthropic/claude-sonnet-4-5' }
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchAgents: vi.fn().mockResolvedValue([]),
        fetchProviders: vi.fn().mockResolvedValue({ all: [], connected: [] }),
        fetchConfig: vi.fn().mockResolvedValue(mockConfig)
      }
      const mockCreateApiClient = vi.fn().mockReturnValue(mockApi)
      const MockEventSource = vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        close: vi.fn()
      }))

      const appInstance = app({
        createApiClient: mockCreateApiClient,
        EventSource: MockEventSource
      })

      await appInstance.connect()

      expect(mockApi.fetchConfig).toHaveBeenCalled()
      expect(appInstance.selectedModel.name).toBe('anthropic/claude-sonnet-4-5')
    })

    test('sets selectedModel from providers.default.model when config.model is missing', async () => {
      const mockConfig = { model: 'anthropic/claude-sonnet-4-5' }
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchAgents: vi.fn().mockResolvedValue([]),
        fetchProviders: vi.fn().mockResolvedValue({}),
        fetchConfig: vi.fn().mockResolvedValue(mockConfig)
      }
      const mockCreateApiClient = vi.fn().mockReturnValue(mockApi)
      const MockEventSource = vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        close: vi.fn()
      }))

      const appInstance = app({
        createApiClient: mockCreateApiClient,
        EventSource: MockEventSource
      })

      await appInstance.connect()

      expect(appInstance.selectedModel.name).toBe('anthropic/claude-sonnet-4-5')
    })
  })

  describe('disconnect', () => {
    test('disconnect closes eventSource', () => {
      const appInstance = app()
      const closeMock = vi.fn()
      appInstance.eventSource = { close: closeMock }

      appInstance.disconnect()

      expect(closeMock).toHaveBeenCalled()
    })

    test('disconnect resets all state', () => {
      const appInstance = app()

      appInstance.connected = true
      appInstance.version = '1.0.0'
      appInstance.sessions = [{ id: 's1' }]
      appInstance.selectedSessionId = 's1'
      appInstance.tree = { id: 'root', children: [] }
      appInstance.selectedNodeId = 'root'
      appInstance.messages = [{ id: 'm1' }]
      appInstance.eventSource = { close: vi.fn() }

      appInstance.disconnect()

      expect(appInstance.connected).toBe(false)
      expect(appInstance.version).toBeNull()
      expect(appInstance.sessions).toEqual([])
      expect(appInstance.selectedSessionId).toBeNull()
      expect(appInstance.tree).toBeNull()
      expect(appInstance.selectedNodeId).toBeNull()
      expect(appInstance.messages).toEqual([])
      expect(appInstance.eventSource).toBeNull()
    })
  })

  describe('selectSession', () => {
    test('loads tree and selects root node', async () => {
      const mockApi = {
        fetchSessionChildren: vi.fn().mockResolvedValue([]),
        fetchMessages: vi.fn().mockResolvedValue([])
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.sessions = [
        { id: 'root', parentID: null, title: 'Root Session' }
      ]

      await appInstance.selectSession('root')

      expect(appInstance.selectedSessionId).toBe('root')
      expect(appInstance.tree).not.toBeNull()
      expect(appInstance.tree.id).toBe('root')
      expect(appInstance.selectedNodeId).toBe('root')
    })

    test('sets error when session not found', async () => {
      const mockApi = {
        fetchSessionChildren: vi.fn().mockResolvedValue([])
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.sessions = []

      await appInstance.selectSession('nonexistent')

      expect(appInstance.error).toBe('Session nonexistent not found')
      expect(appInstance.tree).toBeNull()
    })
  })

  describe('selectNode', () => {
    test('loads and processes messages', async () => {
      const mockApi = {
        fetchMessages: vi.fn().mockResolvedValue([
          { info: { id: 'm1', role: 'user' }, parts: [{ type: 'text', content: 'Hello' }] }
        ])
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi

      await appInstance.selectNode('node1')

      expect(appInstance.selectedNodeId).toBe('node1')
      expect(mockApi.fetchMessages).toHaveBeenCalledWith('node1')
      expect(appInstance.messages).toHaveLength(1)
      expect(appInstance.messages[0].id).toBe('m1')
      expect(appInstance.messages[0].role).toBe('user')
    })

    test('handles messages without id fields', async () => {
      const mockApi = {
        fetchMessages: vi.fn().mockResolvedValue([
          { info: { role: 'assistant' }, parts: [{ type: 'text', content: 'Hello' }] }
        ])
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi

      await appInstance.selectNode('node1')

      expect(appInstance.messages).toHaveLength(1)
      expect(appInstance.messages[0].id).toBeDefined()
      expect(appInstance.messages[0].parts[0].id).toBeDefined()
    })

    test('extracts role from message info', async () => {
      const mockApi = {
        fetchMessages: vi.fn().mockResolvedValue([
          { info: { id: 'm1', role: 'user' }, parts: [] },
          { info: { id: 'm2', role: 'assistant' }, parts: [] }
        ])
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi

      await appInstance.selectNode('node1')

      expect(appInstance.messages[0].role).toBe('user')
      expect(appInstance.messages[1].role).toBe('assistant')
    })
  })

  describe('subscribeToEvents', () => {
    test('dispatches message.part.updated events to update messages', async () => {
      let onmessageHandler = null
      const MockEventSource = vi.fn().mockImplementation(() => ({
        set onmessage(handler) { onmessageHandler = handler },
        set onerror(handler) {},
        close: vi.fn()
      }))
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([])
      }

      const appInstance = app({
        createApiClient: vi.fn().mockReturnValue(mockApi),
        EventSource: MockEventSource
      })

      await appInstance.connect()
      
      appInstance.selectedNodeId = 'session-1'
      appInstance.messages = []

      onmessageHandler({
        data: JSON.stringify({
          type: 'message.part.updated',
          properties: {
            part: { sessionID: 'session-1', messageID: 'msg-1', id: 'part-1', role: 'assistant' },
            delta: 'Hello'
          }
        })
      })

      expect(appInstance.messages).toHaveLength(1)
      expect(appInstance.messages[0].parts[0].content).toBe('Hello')
    })
  })

  describe('getRoleLabel', () => {
    test('returns "Prompt" for user role', () => {
      const appInstance = app()
      expect(appInstance.getRoleLabel('user')).toBe('Prompt')
    })

    test('returns "Assistant" for assistant role', () => {
      const appInstance = app()
      expect(appInstance.getRoleLabel('assistant')).toBe('Assistant')
    })

    test('returns "Assistant" for undefined role', () => {
      const appInstance = app()
      expect(appInstance.getRoleLabel(undefined)).toBe('Assistant')
    })

    test('returns "Assistant" for unknown role', () => {
      const appInstance = app()
      expect(appInstance.getRoleLabel('unknown')).toBe('Assistant')
    })
  })

  describe('getSessionDisplay', () => {
    test('returns title when present', () => {
      const appInstance = app()
      expect(appInstance.getSessionDisplay({ id: 's1', title: 'My Session' })).toBe('My Session')
    })

    test('returns id when title is missing', () => {
      const appInstance = app()
      expect(appInstance.getSessionDisplay({ id: 's1' })).toBe('s1')
    })

    test('returns id when title is empty string', () => {
      const appInstance = app()
      expect(appInstance.getSessionDisplay({ id: 's1', title: '' })).toBe('s1')
    })
  })

  describe('getPartClass', () => {
    test('returns part-type class', () => {
      const appInstance = app()
      expect(appInstance.getPartClass({ type: 'text' })).toBe('part-text')
    })

    test('handles undefined type', () => {
      const appInstance = app()
      expect(appInstance.getPartClass({})).toBe('part-undefined')
    })
  })

  describe('formatVersion', () => {
    test('prefixes version with v', () => {
      const appInstance = app()
      expect(appInstance.formatVersion('1.2.3')).toBe('v1.2.3')
    })
  })

  describe('promptInput', () => {
    test('is initialized to empty string', () => {
      const appInstance = app()
      expect(appInstance.promptInput).toBe('')
    })
  })

  describe('showThinking', () => {
    test('is initialized to false', () => {
      const appInstance = app()
      expect(appInstance.showThinking).toBe(false)
    })
  })

  describe('agents', () => {
    test('is initialized to empty array', () => {
      const appInstance = app()
      expect(appInstance.agents).toEqual([])
    })
  })

  describe('providers', () => {
    test('is initialized to null', () => {
      const appInstance = app()
      expect(appInstance.providers).toBeNull()
    })
  })

  describe('selectedAgent', () => {
    test('is initialized to empty string', () => {
      const appInstance = app()
      expect(appInstance.selectedAgent).toBe('')
    })
  })

  describe('selectedModel', () => {
    test('is initialized to empty string', () => {
      const appInstance = app()
      expect(appInstance.selectedModel).toEqual({})
    })
  })

  describe('toggleThinking', () => {
    test('toggles showThinking from false to true', () => {
      const appInstance = app()
      expect(appInstance.showThinking).toBe(false)

      appInstance.toggleThinking()
      expect(appInstance.showThinking).toBe(true)
    })

    test('toggles showThinking from true to false', () => {
      const appInstance = app()
      appInstance.showThinking = true

      appInstance.toggleThinking()
      expect(appInstance.showThinking).toBe(false)
    })
  })

  describe('sendPrompt', () => {
    test('calls api.sendMessage with selectedNodeId and promptInput', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = 'Hello, assistant!'

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello, assistant!')
    })

    test('clears promptInput after sending', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = 'Hello!'

      await appInstance.sendPrompt()

      expect(appInstance.promptInput).toBe('')
    })

    test('does nothing if promptInput is empty', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = ''

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).not.toHaveBeenCalled()
    })

    test('does nothing if no selectedNodeId', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = null
      appInstance.promptInput = 'Hello!'

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).not.toHaveBeenCalled()
    })

    test('passes selectedAgent to sendMessage', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = 'Hello!'
      appInstance.selectedAgent = 'build'

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello!', { agent: 'build' })
    })

    test('passes selectedModel to sendMessage', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = 'Hello!'
      appInstance.selectedModel = {provider: "my_provider", modelId: "my_model"}

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello!', { model: {"providerID": "my_provider", "modelID": "my_model"} })
    })

    test('passes variant to sendMessage', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = 'Hello!'
      appInstance.selectedModel = {provider: "my_provider", modelId: "my_model"}
      appInstance.selectedVariant = "high"

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello!', { model: {"providerID": "my_provider", "modelID": "my_model"}, variant: "high" })
    })

    test('passes both selectedAgent and selectedModel to sendMessage', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }

      const appInstance = app({ createApiClient: vi.fn() })
      appInstance.api = mockApi
      appInstance.selectedNodeId = 'sess123'
      appInstance.promptInput = 'Hello!'
      appInstance.selectedAgent = 'red'
      appInstance.selectedModel = {provider: "my_provider", modelId: "my_model"}
      

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello!', { agent: 'red', model: {"modelID": "my_model", "providerID": "my_provider"} })
    })
  })

  describe('sessionFilter', () => {
    test('is initialized to empty string', () => {
      const appInstance = app()
      expect(appInstance.sessionFilter).toBe('')
    })
  })

  describe('filteredSessions', () => {
    test('returns all rootSessions when sessionFilter is empty', () => {
      const appInstance = app()
      appInstance.sessions = [
        { id: 'root-1', title: 'First Session' },
        { id: 'root-2', title: 'Second Session' },
        { id: 'child-1', parentID: 'root-1', title: 'Child' }
      ]
      appInstance.sessionFilter = ''

      expect(appInstance.filteredSessions).toHaveLength(2)
      expect(appInstance.filteredSessions[0].id).toBe('root-1')
      expect(appInstance.filteredSessions[1].id).toBe('root-2')
    })

    test('returns filtered sessions when sessionFilter has value', () => {
      const appInstance = app()
      appInstance.sessions = [
        { id: 'root-1', title: 'First Session' },
        { id: 'root-2', title: 'Second Session' },
        { id: 'root-3', title: 'Another One' }
      ]
      appInstance.sessionFilter = 'first'

      expect(appInstance.filteredSessions).toHaveLength(1)
      expect(appInstance.filteredSessions[0].id).toBe('root-1')
    })
  })

  describe('filteredModels', () => {
    test('returns filtered models based on modelFilter', () => {
      const appInstance = app()
      appInstance.providers = {
        all: [
          { id: 'anthropic', models: { 'claude-3-opus': {name: "Claude Opus"}, 'claude-3-sonnet': {name: "Claude Sonnet"} } },
          { id: 'openai', models: { 'gpt-4': {name: "GPT-4"} } }
        ]
      }
      appInstance.modelFilter = 'claude'

      expect(appInstance.filteredModels).toHaveLength(2)
      expect(appInstance.filteredModels).toContainEqual({ id: 'anthropic/claude-3-opus', name: "Claude Opus", provider: 'anthropic', model: 'claude-3-opus' })
      expect(appInstance.filteredModels).toContainEqual({ id: 'anthropic/claude-3-sonnet', name: "Claude Sonnet", provider: 'anthropic', model: 'claude-3-sonnet' })
    })
  })

  describe('currentModelVariants', () => {
    test('returns variants for selected model', () => {
      const appInstance = app()
      appInstance.selectedModel = { variants: {"high": "hi", "max": "something"} }

      expect(appInstance.currentModelVariants).toEqual(['high', 'max'])
    })
  })
})



