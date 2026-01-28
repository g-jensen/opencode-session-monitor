vi.hoisted(() => {
  globalThis.window = {}
})

import {
  app as createApp,
  isTextPart,
  isToolPart,
  isReasoningPart,
  isFilePart,
  isAgentPart,
  isSubtaskPart,
  isStepStartPart,
  isStepFinishPart,
  isSnapshotPart,
  isPatchPart,
  isRetryPart,
  isCompactionPart,
  getAgentDisplay,
  getReasoningDisplay,
  getFileDisplay,
  getSubtaskDisplay,
  getRetryDisplay,
  getPatchDisplay,
  shouldShowPart,
  getTaskSessionId,
  isClickableTaskPart,
  filterSessions,
  filterModels,
  getTreePrefix,
  isDisconnected,
  isNotConnecting,
  isSessionSelected,
  hasNoFilteredSessions,
  getThinkingButtonText,
  isDefaultModelSelected,
  isModelSelected,
  hasNoFilteredModels,
  showMainPanels,
  shouldShowReasoningPart,
  getAgentButtonText,
  isDefaultAgentSelected,
  isAgentSelected,
  isPromptDisabled,
  isSendDisabled,
  showEmptyState,
  getModelVariants,
  hasVariants,
  isVariantSelected,
  isDefaultVariantSelected,
  getVariantButtonText,
  getModelWithVariant
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
      const mockAgents = [{ name: 'build' }, { name: 'plan' }]
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchAgents: vi.fn().mockResolvedValue(mockAgents),
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

      expect(mockApi.fetchAgents).toHaveBeenCalled()
      expect(appInstance.agents).toEqual(mockAgents)
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
      expect(appInstance.selectedModel).toBe('anthropic/claude-sonnet-4-5')
    })

    test('sets selectedModel from providers.default.model when config.model is missing', async () => {
      const mockProviders = {
        all: [{ id: 'anthropic', models: { 'claude-sonnet': {} } }],
        connected: ['anthropic'],
        default: { model: 'anthropic/claude-sonnet' }
      }
      const mockApi = {
        fetchHealth: vi.fn().mockResolvedValue({ version: '1.0.0' }),
        fetchSessions: vi.fn().mockResolvedValue([]),
        fetchAgents: vi.fn().mockResolvedValue([]),
        fetchProviders: vi.fn().mockResolvedValue(mockProviders),
        fetchConfig: vi.fn().mockResolvedValue({})
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

      expect(appInstance.selectedModel).toBe('anthropic/claude-sonnet')
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

  describe('getToolDisplay', () => {
    test('returns formatted when present', () => {
      const appInstance = app()
      expect(appInstance.getToolDisplay({ formatted: 'ls -la', tool: 'bash' })).toBe('ls -la')
    })

    test('returns tool name when formatted missing', () => {
      const appInstance = app()
      expect(appInstance.getToolDisplay({ tool: 'bash' })).toBe('bash')
    })

    test('returns tool name when input missing', () => {
      const appInstance = app()
      expect(appInstance.getToolDisplay({ tool: 'bash', state: {status: "running"}})).toBe('bash')
    })

    test('returns tool name with input when present', () => {
      const appInstance = app()
      expect(appInstance.getToolDisplay({ tool: 'bash', state: {input: {name: "param"}}})).toBe('bash [name=param]')
    })

    test('returns tool name with input with multiple params', () => {
      const appInstance = app()
      expect(appInstance.getToolDisplay({ tool: 'bash', state: {input: {name: "param", other: "hi"}}})).toBe('bash [name=param,other=hi]')
    })

    test('returns Task with subagent_type and description', () => {
      const appInstance = app()
      const part = {
        type: 'tool',
        tool: 'task',
        state: {
          input: {
            description: 'Write failing test',
            prompt: 'Write a test for the new feature...',
            subagent_type: 'red'
          }
        }
      }
      expect(appInstance.getToolDisplay(part)).toBe('Task [red]: Write failing test')
    })

    test('returns Task with description only when no subagent_type', () => {
      const appInstance = app()
      const part = {
        type: 'tool',
        tool: 'task',
        state: {
          input: {
            description: 'Analyze codebase',
            prompt: 'Look at the code...'
          }
        }
      }
      expect(appInstance.getToolDisplay(part)).toBe('Task: Analyze codebase')
    })

    test('returns Task when no input provided', () => {
      const appInstance = app()
      const part = {
        type: 'tool',
        tool: 'task',
        state: {}
      }
      expect(appInstance.getToolDisplay(part)).toBe('Task')
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
      expect(appInstance.selectedModel).toBe('')
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
      appInstance.selectedModel = 'claude-3-opus'

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello!', { model: 'claude-3-opus' })
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
      appInstance.selectedModel = 'claude-3-opus'

      await appInstance.sendPrompt()

      expect(mockApi.sendMessage).toHaveBeenCalledWith('sess123', 'Hello!', { agent: 'red', model: 'claude-3-opus' })
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
      appInstance.providers = {
        all: [
          {
            id: 'anthropic',
            models: {
              'claude-sonnet': { variants: ['high', 'max'] }
            }
          }
        ],
        connected: ['anthropic']
      }
      appInstance.selectedModel = 'anthropic/claude-sonnet'

      expect(appInstance.currentModelVariants).toEqual(['high', 'max'])
    })
  })
})

describe('part type checks', () => {
  describe('isTextPart', () => {
    test('returns true for text type', () => {
      expect(isTextPart({ type: 'text' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isTextPart({ type: 'tool' })).toBe(false)
      expect(isTextPart({ type: 'reasoning' })).toBe(false)
      expect(isTextPart({})).toBe(false)
    })
  })

  describe('isToolPart', () => {
    test('returns true for tool type', () => {
      expect(isToolPart({ type: 'tool' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isToolPart({ type: 'text' })).toBe(false)
      expect(isToolPart({ type: 'reasoning' })).toBe(false)
      expect(isToolPart({})).toBe(false)
    })
  })

  describe('isReasoningPart', () => {
    test('returns true for reasoning type', () => {
      expect(isReasoningPart({ type: 'reasoning' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isReasoningPart({ type: 'text' })).toBe(false)
      expect(isReasoningPart({ type: 'tool' })).toBe(false)
      expect(isReasoningPart({})).toBe(false)
    })
  })

  describe('isFilePart', () => {
    test('returns true for file type', () => {
      expect(isFilePart({ type: 'file' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isFilePart({ type: 'text' })).toBe(false)
      expect(isFilePart({ type: 'tool' })).toBe(false)
      expect(isFilePart({})).toBe(false)
    })
  })

  describe('isAgentPart', () => {
    test('returns true for agent type', () => {
      expect(isAgentPart({ type: 'agent' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isAgentPart({ type: 'text' })).toBe(false)
      expect(isAgentPart({ type: 'tool' })).toBe(false)
      expect(isAgentPart({})).toBe(false)
    })
  })

  describe('isSubtaskPart', () => {
    test('returns true for subtask type', () => {
      expect(isSubtaskPart({ type: 'subtask' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isSubtaskPart({ type: 'text' })).toBe(false)
      expect(isSubtaskPart({ type: 'tool' })).toBe(false)
      expect(isSubtaskPart({})).toBe(false)
    })
  })

  describe('isStepStartPart', () => {
    test('returns true for step-start type', () => {
      expect(isStepStartPart({ type: 'step-start' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isStepStartPart({ type: 'text' })).toBe(false)
      expect(isStepStartPart({ type: 'step-finish' })).toBe(false)
      expect(isStepStartPart({})).toBe(false)
    })
  })

  describe('isStepFinishPart', () => {
    test('returns true for step-finish type', () => {
      expect(isStepFinishPart({ type: 'step-finish' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isStepFinishPart({ type: 'text' })).toBe(false)
      expect(isStepFinishPart({ type: 'step-start' })).toBe(false)
      expect(isStepFinishPart({})).toBe(false)
    })
  })

  describe('isSnapshotPart', () => {
    test('returns true for snapshot type', () => {
      expect(isSnapshotPart({ type: 'snapshot' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isSnapshotPart({ type: 'text' })).toBe(false)
      expect(isSnapshotPart({ type: 'patch' })).toBe(false)
      expect(isSnapshotPart({})).toBe(false)
    })
  })

  describe('isPatchPart', () => {
    test('returns true for patch type', () => {
      expect(isPatchPart({ type: 'patch' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isPatchPart({ type: 'text' })).toBe(false)
      expect(isPatchPart({ type: 'snapshot' })).toBe(false)
      expect(isPatchPart({})).toBe(false)
    })
  })

  describe('isRetryPart', () => {
    test('returns true for retry type', () => {
      expect(isRetryPart({ type: 'retry' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isRetryPart({ type: 'text' })).toBe(false)
      expect(isRetryPart({ type: 'tool' })).toBe(false)
      expect(isRetryPart({})).toBe(false)
    })
  })

  describe('isCompactionPart', () => {
    test('returns true for compaction type', () => {
      expect(isCompactionPart({ type: 'compaction' })).toBe(true)
    })

    test('returns false for other types', () => {
      expect(isCompactionPart({ type: 'text' })).toBe(false)
      expect(isCompactionPart({ type: 'tool' })).toBe(false)
      expect(isCompactionPart({})).toBe(false)
    })
  })
})

describe('part display functions', () => {
  describe('getAgentDisplay', () => {
    test('returns "Skill: {name}" for agent part with name', () => {
      expect(getAgentDisplay({ type: 'agent', name: 'golang' })).toBe('Skill: golang')
    })

    test('returns "Skill" for agent part without name', () => {
      expect(getAgentDisplay({ type: 'agent' })).toBe('Skill')
    })
  })

  describe('getReasoningDisplay', () => {
    test('returns the text from part.text', () => {
      expect(getReasoningDisplay({ type: 'reasoning', text: 'thinking about this' })).toBe('thinking about this')
    })

    test('returns empty string if no text', () => {
      expect(getReasoningDisplay({ type: 'reasoning' })).toBe('')
    })
  })

  describe('getFileDisplay', () => {
    test('returns filename when present', () => {
      expect(getFileDisplay({ type: 'file', filename: 'report.pdf', url: 'https://example.com/report.pdf' })).toBe('report.pdf')
    })

    test('returns url when filename missing', () => {
      expect(getFileDisplay({ type: 'file', url: 'https://example.com/report.pdf' })).toBe('https://example.com/report.pdf')
    })

    test('returns "File" when both missing', () => {
      expect(getFileDisplay({ type: 'file' })).toBe('File')
    })
  })

  describe('getSubtaskDisplay', () => {
    test('returns "Subtask [{agent}]: {description}" when both present', () => {
      expect(getSubtaskDisplay({ type: 'subtask', agent: 'red', description: 'Write test' })).toBe('Subtask [red]: Write test')
    })

    test('returns "Subtask: {description}" when no agent', () => {
      expect(getSubtaskDisplay({ type: 'subtask', description: 'Analyze code' })).toBe('Subtask: Analyze code')
    })

    test('returns "Subtask" when no description', () => {
      expect(getSubtaskDisplay({ type: 'subtask' })).toBe('Subtask')
    })
  })

  describe('getRetryDisplay', () => {
    test('returns "Retry attempt {attempt}" for retry part', () => {
      expect(getRetryDisplay({ type: 'retry', attempt: 3 })).toBe('Retry attempt 3')
    })
  })

  describe('getPatchDisplay', () => {
    test('returns "Patch: {n} files" based on files array length', () => {
      expect(getPatchDisplay({ type: 'patch', hash: 'abc123', files: ['a.js', 'b.js', 'c.js'] })).toBe('Patch: 3 files')
    })

    test('returns "Patch: 0 files" when files empty or missing', () => {
      expect(getPatchDisplay({ type: 'patch', hash: 'abc123', files: [] })).toBe('Patch: 0 files')
      expect(getPatchDisplay({ type: 'patch', hash: 'abc123' })).toBe('Patch: 0 files')
    })
  })
})

describe('shouldShowPart', () => {
  test('returns false for reasoning part when showThinking is false', () => {
    expect(shouldShowPart({ type: 'reasoning' }, false)).toBe(false)
  })

  test('returns true for reasoning part when showThinking is true', () => {
    expect(shouldShowPart({ type: 'reasoning' }, true)).toBe(true)
  })

  test('returns true for text part regardless of showThinking', () => {
    expect(shouldShowPart({ type: 'text' }, false)).toBe(true)
    expect(shouldShowPart({ type: 'text' }, true)).toBe(true)
  })

  test('returns true for tool part regardless of showThinking', () => {
    expect(shouldShowPart({ type: 'tool' }, false)).toBe(true)
    expect(shouldShowPart({ type: 'tool' }, true)).toBe(true)
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
    expect(getTaskSessionId(part)).toBe('ses_child123')
  })

  test('returns undefined for task part without metadata', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {
        status: 'running'
      }
    }
    expect(getTaskSessionId(part)).toBeUndefined()
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
    expect(getTaskSessionId(part)).toBeUndefined()
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
    expect(isClickableTaskPart(part)).toBe(true)
  })

  test('returns false for task part without sessionId', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {
        status: 'running'
      }
    }
    expect(isClickableTaskPart(part)).toBe(false)
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
    expect(isClickableTaskPart(part)).toBe(false)
  })

  test('returns false for non-tool part', () => {
    const part = {
      type: 'text',
      content: 'hello'
    }
    expect(isClickableTaskPart(part)).toBe(false)
  })
})

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

describe('filterModels', () => {
  const providers = {
    all: [
      { id: 'anthropic', models: { 'claude-3-opus': {name: "Claude Opus"}, 'claude-3-sonnet': {name: "Claude Sonnet"} } },
      { id: 'openai', models: { 'gpt-4': {name: "GPT-4"}, 'gpt-3.5-turbo': {name: "GPT-3.5"} } }
    ],
    connected: ['anthropic']
  }

  test('returns all models when query is empty', () => {
    const result = filterModels(providers, '')

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ id: 'anthropic/claude-3-opus', name: "Claude Opus", provider: 'anthropic', model: 'claude-3-opus' })
    expect(result).toContainEqual({ id: 'anthropic/claude-3-sonnet', name: "Claude Sonnet", provider: 'anthropic', model: 'claude-3-sonnet' })
    expect(result).not.toContainEqual({ id: 'openai/gpt-4', name: "GPT-4", provider: 'openai', model: 'gpt-4' })
    expect(result).not.toContainEqual({ id: 'openai/gpt-3.5-turbo', name: "GPT-3.5", provider: 'openai', model: 'gpt-3.5-turbo' })
  })

  test('filters models by case-insensitive match on full id', () => {
    const result = filterModels(providers, 'CLAUDE')

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ id: 'anthropic/claude-3-opus', name: "Claude Opus", provider: 'anthropic', model: 'claude-3-opus' })
    expect(result).toContainEqual({ id: 'anthropic/claude-3-sonnet', name: "Claude Sonnet", provider: 'anthropic', model: 'claude-3-sonnet' })
  })

  test('returns empty array when providers is null', () => {
    expect(filterModels(null, '')).toEqual([])
  })

  test('returns empty array when providers is undefined', () => {
    expect(filterModels(undefined, '')).toEqual([])
  })

  test('returns empty array when no models match', () => {
    expect(filterModels(providers, 'gemini')).toEqual([])
  })

  test('returns empty array when no providers are connected', () => {
    const providersNoneConnected = {
      all: [
        { id: 'anthropic', models: { 'claude-3-opus': {}, 'claude-3-sonnet': {} } },
        { id: 'openai', models: { 'gpt-4': {}, 'gpt-3.5-turbo': {} } }
      ],
      connected: []
    }

    const result = filterModels(providersNoneConnected, '')

    expect(result).toEqual([])
  })

  test('returns all models when connected array is missing', () => {
    const providersNoConnected = {
      all: [
        { id: 'anthropic', models: { 'claude-3-opus': {}, 'claude-3-sonnet': {} } },
        { id: 'openai', models: { 'gpt-4': {}, 'gpt-3.5-turbo': {} } }
      ]
    }

    const result = filterModels(providersNoConnected, '')

    expect(result).toHaveLength(4)
    expect(result).toContainEqual({ id: 'anthropic/claude-3-opus', provider: 'anthropic', model: 'claude-3-opus' })
    expect(result).toContainEqual({ id: 'openai/gpt-4', provider: 'openai', model: 'gpt-4' })
  })
})

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

describe('getThinkingButtonText', () => {
  test('returns "Hide Thinking" when showThinking is true', () => {
    expect(getThinkingButtonText(true)).toBe('Hide Thinking')
  })

  test('returns "Show Thinking" when showThinking is false', () => {
    expect(getThinkingButtonText(false)).toBe('Show Thinking')
  })
})

describe('isDefaultModelSelected', () => {
  test('returns true when selectedModel is empty string', () => {
    expect(isDefaultModelSelected('')).toBe(true)
  })

  test('returns true when selectedModel is null', () => {
    expect(isDefaultModelSelected(null)).toBe(true)
  })

  test('returns false when selectedModel has value', () => {
    expect(isDefaultModelSelected('anthropic/claude')).toBe(false)
  })
})

describe('isModelSelected', () => {
  test('returns true when model.id matches selectedModel', () => {
    expect(isModelSelected({ id: 'anthropic/claude' }, 'anthropic/claude')).toBe(true)
  })

  test('returns false when model.id does not match selectedModel', () => {
    expect(isModelSelected({ id: 'anthropic/claude' }, 'openai/gpt-4')).toBe(false)
  })
})

describe('hasNoFilteredModels', () => {
  test('returns true when array is empty', () => {
    expect(hasNoFilteredModels([])).toBe(true)
  })

  test('returns false when array has models', () => {
    expect(hasNoFilteredModels([{ id: 'model-1' }])).toBe(false)
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

describe('shouldShowReasoningPart', () => {
  test('returns true for reasoning part when showThinking is true', () => {
    expect(shouldShowReasoningPart({ type: 'reasoning' }, true)).toBe(true)
  })

  test('returns false for reasoning part when showThinking is false', () => {
    expect(shouldShowReasoningPart({ type: 'reasoning' }, false)).toBe(false)
  })

  test('returns false for text part when showThinking is true', () => {
    expect(shouldShowReasoningPart({ type: 'text' }, true)).toBe(false)
  })

  test('returns false for text part when showThinking is false', () => {
    expect(shouldShowReasoningPart({ type: 'text' }, false)).toBe(false)
  })
})

describe('getAgentButtonText', () => {
  test('returns "Agent" when selectedAgent is empty string', () => {
    expect(getAgentButtonText('')).toBe('Agent')
  })

  test('returns "Agent" when selectedAgent is null', () => {
    expect(getAgentButtonText(null)).toBe('Agent')
  })

  test('returns agent name when selectedAgent has value', () => {
    expect(getAgentButtonText('coder')).toBe('coder')
  })
})

describe('isDefaultAgentSelected', () => {
  test('returns true when selectedAgent is empty string', () => {
    expect(isDefaultAgentSelected('')).toBe(true)
  })

  test('returns true when selectedAgent is null', () => {
    expect(isDefaultAgentSelected(null)).toBe(true)
  })

  test('returns false when selectedAgent has value', () => {
    expect(isDefaultAgentSelected('coder')).toBe(false)
  })
})

describe('isAgentSelected', () => {
  test('returns true when agent.name matches selectedAgent', () => {
    expect(isAgentSelected({ name: 'coder' }, 'coder')).toBe(true)
  })

  test('returns false when agent.name does not match selectedAgent', () => {
    expect(isAgentSelected({ name: 'coder' }, 'writer')).toBe(false)
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

describe('getModelVariants', () => {
  const providers = {
    all: [
      { 
        id: 'anthropic', 
        models: { 
          'claude-sonnet': { variants: ['high', 'max'] },
          'claude-opus': {}
        } 
      },
      { 
        id: 'openai', 
        models: { 
          'gpt-5': { variants: ['none', 'low', 'medium', 'high'] }
        } 
      }
    ],
    connected: ['anthropic', 'openai']
  }

  test('returns variants for a model that has them', () => {
    expect(getModelVariants(providers, 'anthropic/claude-sonnet')).toEqual(['high', 'max'])
  })

  test('returns empty array for model with no variants', () => {
    expect(getModelVariants(providers, 'anthropic/claude-opus')).toEqual([])
  })

  test('returns empty array when model not found', () => {
    expect(getModelVariants(providers, 'anthropic/unknown')).toEqual([])
  })

  test('returns empty array when providers is null', () => {
    expect(getModelVariants(null, 'anthropic/claude-sonnet')).toEqual([])
  })

  test('returns empty array when selectedModel is empty', () => {
    expect(getModelVariants(providers, '')).toEqual([])
  })
})

describe('hasVariants', () => {
  test('returns true when variants array has items', () => {
    expect(hasVariants(['high', 'max'])).toBe(true)
  })

  test('returns false when variants array is empty', () => {
    expect(hasVariants([])).toBe(false)
  })

  test('returns false when variants is null', () => {
    expect(hasVariants(null)).toBe(false)
  })
})

describe('isVariantSelected', () => {
  test('returns true when variant matches selectedVariant', () => {
    expect(isVariantSelected('high', 'high')).toBe(true)
  })

  test('returns false when variant does not match selectedVariant', () => {
    expect(isVariantSelected('high', 'max')).toBe(false)
  })
})

describe('isDefaultVariantSelected', () => {
  test('returns true when selectedVariant is empty string', () => {
    expect(isDefaultVariantSelected('')).toBe(true)
  })

  test('returns true when selectedVariant is null', () => {
    expect(isDefaultVariantSelected(null)).toBe(true)
  })

  test('returns false when selectedVariant has value', () => {
    expect(isDefaultVariantSelected('high')).toBe(false)
  })
})

describe('getVariantButtonText', () => {
  test('returns "Variant" when selectedVariant is empty string', () => {
    expect(getVariantButtonText('')).toBe('Variant')
  })

  test('returns variant name when selectedVariant has value', () => {
    expect(getVariantButtonText('high')).toBe('high')
  })
})

describe('getModelWithVariant', () => {
  test('returns just model when variant is empty string', () => {
    expect(getModelWithVariant('anthropic/claude-sonnet', '')).toBe('anthropic/claude-sonnet')
  })

  test('returns model:variant format when variant is selected', () => {
    expect(getModelWithVariant('anthropic/claude-sonnet', 'high')).toBe('anthropic/claude-sonnet:high')
  })

  test('returns just model when variant is null', () => {
    expect(getModelWithVariant('anthropic/claude-sonnet', null)).toBe('anthropic/claude-sonnet')
  })

  test('returns empty string when model is empty', () => {
    expect(getModelWithVariant('', 'high')).toBe('')
  })

  test('returns empty string when model is null', () => {
    expect(getModelWithVariant(null, 'high')).toBe('')
  })
})
