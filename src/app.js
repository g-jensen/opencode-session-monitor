import { 
  createApiClient as defaultCreateApiClient, 
  buildTree,
  processParts,
  parseEvent,
  handlePartUpdated,
  handleSessionCreated,
  handleSessionUpdated,
  handleSessionStatus,
  handleMessageUpdated
} from './index.js'

export function isTextPart(part) {
  return part.type === 'text'
}

export function isToolPart(part) {
  return part.type === 'tool'
}

export function isReasoningPart(part) {
  return part.type === 'reasoning'
}

export function isFilePart(part) {
  return part.type === 'file'
}

export function isAgentPart(part) {
  return part.type === 'agent'
}

export function isSubtaskPart(part) {
  return part.type === 'subtask'
}

export function isStepStartPart(part) {
  return part.type === 'step-start'
}

export function isStepFinishPart(part) {
  return part.type === 'step-finish'
}

export function isSnapshotPart(part) {
  return part.type === 'snapshot'
}

export function isPatchPart(part) {
  return part.type === 'patch'
}

export function isRetryPart(part) {
  return part.type === 'retry'
}

export function isCompactionPart(part) {
  return part.type === 'compaction'
}

export function isDisconnected(connected) {
  return !connected
}

export function isSessionSelected(session, selectedSessionId) {
  return session.id === selectedSessionId
}

export function hasNoFilteredSessions(filteredSessions) {
  return filteredSessions.length === 0
}

export function isDefaultModelSelected(selectedModel) {
  return !selectedModel
}

export function isModelSelected(model, selectedModel) {
  return model.id === selectedModel
}

export function hasNoFilteredModels(filteredModels) {
  return filteredModels.length === 0
}

export function isNotConnecting(connecting) {
  return !connecting
}

export function shouldShowPart(part, showThinking) {
  if (part.type === 'reasoning') return showThinking
  return true
}

export function getThinkingButtonText(showThinking) {
  return showThinking ? 'Hide Thinking' : 'Show Thinking'
}

export function getAgentButtonText(selectedAgent) {
  return selectedAgent || 'Agent'
}

export function isDefaultAgentSelected(selectedAgent) {
  return !selectedAgent
}

export function isAgentSelected(agent, selectedAgent) {
  return agent.name === selectedAgent
}

export function hasVariants(variants) {
  return !!(variants && variants.length > 0)
}

export function isVariantSelected(variant, selectedVariant) {
  return variant === selectedVariant
}

export function isDefaultVariantSelected(selectedVariant) {
  return !selectedVariant
}

export function getVariantButtonText(selectedVariant) {
  return selectedVariant || 'Variant'
}

export function getModelWithVariant(selectedModel, selectedVariant) {
  if (!selectedModel) return ''
  if (!selectedVariant) return selectedModel
  return `${selectedModel}:${selectedVariant}`
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

export function shouldShowReasoningPart(part, showThinking) {
  return isReasoningPart(part) && showThinking
}

export function getTaskSessionId(part) {
  if (part.tool !== 'task') return undefined
  return part.state?.metadata?.sessionId
}

export function isClickableTaskPart(part) {
  return part.tool === 'task' && !!getTaskSessionId(part)
}

export function getAgentDisplay(part) {
  return part.name ? `Skill: ${part.name}` : 'Skill'
}

export function getReasoningDisplay(part) {
  return part.text || ''
}

export function getFileDisplay(part) {
  return part.filename || part.url || 'File'
}

export function getSubtaskDisplay(part) {
  if (!part.description) return 'Subtask'
  if (part.agent) return `Subtask [${part.agent}]: ${part.description}`
  return `Subtask: ${part.description}`
}

export function getRetryDisplay(part) {
  return `Retry attempt ${part.attempt}`
}

export function filterSessions(sessions, query) {
  if (!query) return sessions
  const q = query.toLowerCase()
  return sessions.filter(s => 
    (s.title?.toLowerCase().includes(q)) || 
    (s.id?.toLowerCase().includes(q))
  )
}

export function filterModels(providers, query) {
  if (!providers) return []
  const connectedSet = providers.connected ? new Set(providers.connected) : null
  const models = []
  for (const provider of providers.all || []) {
    if (connectedSet && !connectedSet.has(provider.id)) continue
    for (const model of Object.keys(provider.models || {})) {
      const name = provider.models[model].name
      const id = `${provider.id}/${model}`
      models.push({ id, name: name, provider: provider.id, model })
    }
  }
  if (!query) return models
  const q = query.toLowerCase()
  return models.filter(m => m.name.toLowerCase().includes(q))
}

export function getModelVariants(providers, selectedModel) {
  if (!providers || !selectedModel) return []
  
  const [providerId, modelId] = selectedModel.split('/')
  if (!providerId || !modelId) return []
  
  const provider = providers.all?.find(p => p.id === providerId)
  if (!provider) return []
  
  const model = provider.models?.[modelId]
  if (!model || !model.variants) return []
  
  return model.variants
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

export function getPatchDisplay(part) {
  const count = part.files?.length || 0
  return `Patch: ${count} files`
}

function defaultScrollMessagesToBottom(force = false) {
  const container = document.querySelector('.messages')
  if (!container) return
  const threshold = 50
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  if (force || isNearBottom) {
    container.scrollTop = container.scrollHeight
  }
}

function defaultGetScrollPosition() {
  const container = document.querySelector('.messages')
  return container ? container.scrollTop : 0
}

function defaultSetScrollPosition(position) {
  const container = document.querySelector('.messages')
  if (container) {
    container.scrollTop = position
  }
}

function params(partInput) {
  let keys = Object.keys(partInput)
  let key_count = keys.length
  let output = ""
  keys.forEach((key, idx) => {
    output += `${key}=${partInput[key]}`
    output += idx < key_count-1 ? "," : ""
  })
  return output
}

function hasStateInput(part) {
  return part.state !== undefined && part.state.input !== undefined
}

function toolWithParams(part) {
  if (hasStateInput(part)) {
    return `${part.tool} [${params(part.state.input)}]`
  }
  return part.tool
}

export function app(deps = {}) {
  const {
    createApiClient = defaultCreateApiClient,
    EventSource = globalThis.EventSource,
    scrollMessagesToBottom = defaultScrollMessagesToBottom,
    getScrollPosition = defaultGetScrollPosition,
    setScrollPosition = defaultSetScrollPosition
  } = deps

  return {
    serverUrl: 'http://localhost:4096',
    connected: false,
    connecting: false,
    error: null,
    version: null,
    
    sessions: [],
    get rootSessions() {
      return this.sessions.filter(s => !s.parentID && !s.parentId)
    },
    get filteredSessions() {
      return filterSessions(this.rootSessions, this.sessionFilter)
    },
    get filteredModels() {
      return filterModels(this.providers, this.modelFilter)
    },
    get currentModelVariants() {
      return getModelVariants(this.providers, this.selectedModel)
    },
    selectedSessionId: null,
    tree: null,
    selectedNodeId: null,
    messages: [],
    scrollPositions: {},
    promptInput: '',
    
    panelsSwapped: false,
    showThinking: false,
    sessionFilter: '',
    showSessionDropdown: false,
    modelFilter: '',
    showModelDropdown: false,
    
    agents: [],
    providers: null,
    selectedAgent: '',
    selectedModel: '',
    selectedVariant: '',
    showAgentDropup: false,
    showVariantDropdown: false,
    
    api: null,
    eventSource: null,

    async connect() {
      this.connecting = true
      this.error = null
      
      try {
        this.api = createApiClient(this.serverUrl, { apiKey: null })
        const health = await this.api.fetchHealth()
        this.version = health.version
        this.connected = true
        this.sessions = await this.api.fetchSessions()
        if (this.api.fetchAgents) {
          this.agents = await this.api.fetchAgents()
          if (this.agents.length > 0) {
            this.selectedAgent = this.agents[0].name
          }
        }
        if (this.api.fetchProviders) this.providers = await this.api.fetchProviders()
        if (this.api.fetchConfig) {
          const config = await this.api.fetchConfig()
          if (config.model) {
            this.selectedModel = config.model
            this.modelFilter = config.model
          }
        }
        if (!this.selectedModel && this.providers?.default?.model) {
          this.selectedModel = this.providers.default.model
          this.modelFilter = this.providers.default.model
        }
        this.subscribeToEvents()
      } catch (e) {
        this.error = e.message
        this.connected = false
      } finally {
        this.connecting = false
      }
    },

    disconnect() {
      if (this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }
      this.connected = false
      this.api = null
      this.sessions = []
      this.selectedSessionId = null
      this.tree = null
      this.selectedNodeId = null
      this.messages = []
      this.version = null
    },

    subscribeToEvents() {
      this.eventSource = new EventSource(`${this.serverUrl}/event`)
      
      const handlers = {
        'message.part.updated': (props) => handlePartUpdated(this, props),
        'message.updated': (props) => handleMessageUpdated(this, props),
        'session.created': (props) => handleSessionCreated(this, props),
        'session.updated': (props) => handleSessionUpdated(this, props),
        'session.status': (props) => handleSessionStatus(this, props)
      }

      this.eventSource.onmessage = (e) => {
        const event = parseEvent(e.data)
        console.log('SSE event:', event.type, event.properties)
        if (event.properties?.part) {
          console.log('Part:', JSON.stringify(event.properties.part, null, 2))
        }
        const handler = handlers[event.type]
        if (handler) {
          handler(event.properties)
          if (event.type === 'message.part.updated') {
            this.scrollToBottom()
          }
        }
      }

      this.eventSource.onerror = () => {
        this.error = 'SSE connection lost'
      }
    },

    async selectSession(sessionId) {
      if (!sessionId) return
      this.selectedSessionId = sessionId
      this.error = null
      
      try {
        const children = await this.loadChildrenRecursive(sessionId)
        const rootSession = this.sessions.find(s => s.id === sessionId)
        if (!rootSession) {
          this.error = `Session ${sessionId} not found`
          return
        }
        const allSessions = [rootSession, ...children]
        
        this.tree = buildTree(allSessions)
        await this.selectNode(sessionId)
        this.scrollToBottom(true)
      } catch (e) {
        this.error = e.message
      }
    },

    async loadChildrenRecursive(sessionId) {
      const children = await this.api.fetchSessionChildren(sessionId)
      const descendants = []
      
      for (const child of children) {
        descendants.push(child)
        const grandchildren = await this.loadChildrenRecursive(child.id)
        descendants.push(...grandchildren)
      }
      
      return descendants
    },

    async selectNode(nodeId) {
      if (this.selectedNodeId) {
        this.scrollPositions[this.selectedNodeId] = getScrollPosition()
      }
      
      this.selectedNodeId = nodeId
      
      try {
        const rawMessages = await this.api.fetchMessages(nodeId)
        this.messages = rawMessages.map((m, mIdx) => ({
          ...m.info,
          id: m.info?.id || `msg-${mIdx}`,
          role: m.info?.role,
          parts: processParts(m.parts || []).map((p, pIdx) => ({
            ...p,
            id: p.id || `part-${mIdx}-${pIdx}`
          }))
        }))
        
        if (this.scrollPositions[nodeId] !== undefined) {
          setTimeout(() => setScrollPosition(this.scrollPositions[nodeId]), 50)
        }
      } catch (e) {
        this.error = e.message
      }
    },

    async abortSession() {
      if (!this.selectedSessionId) return
      
      try {
        await this.api.abortSession(this.selectedSessionId)
      } catch (e) {
        this.error = e.message
      }
    },

    swapPanels() {
      this.panelsSwapped = !this.panelsSwapped
    },

    toggleThinking() {
      this.showThinking = !this.showThinking
    },

    toggleAgentDropup() {
      this.showAgentDropup = !this.showAgentDropup
    },

    toggleVariantDropdown() {
      this.showVariantDropdown = !this.showVariantDropdown
    },

    async sendPrompt() {
      if (!this.promptInput || !this.selectedNodeId) return
      const opts = {}
      if (this.selectedAgent) opts.agent = this.selectedAgent
      const modelWithVariant = getModelWithVariant(this.selectedModel, this.selectedVariant)
      if (modelWithVariant) opts.model = modelWithVariant
      if (Object.keys(opts).length > 0) {
        await this.api.sendMessage(this.selectedNodeId, this.promptInput, opts)
      } else {
        await this.api.sendMessage(this.selectedNodeId, this.promptInput)
      }
      this.promptInput = ''
    },

    getRoleLabel(role) {
      return role === 'user' ? 'Prompt' : 'Assistant'
    },

    getSessionDisplay(session) {
      return session.title || session.id
    },

    getPartClass(part) {
      return 'part-' + part.type
    },

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
    shouldShowPart,
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
    hasVariants,
    isVariantSelected,
    isDefaultVariantSelected,
    getVariantButtonText,
    getModelWithVariant,
    isPromptDisabled,
    isSendDisabled,
    showEmptyState,

    getAgentDisplay,
    getReasoningDisplay,
    getFileDisplay,
    getSubtaskDisplay,
    getRetryDisplay,
    getPatchDisplay,
    getTaskSessionId,
    isClickableTaskPart,
    filterSessions,
    getTreePrefix,
    getModelVariants,

    getToolDisplay(part) {
      if (part.tool === 'task') {
        const input = part.state?.input
        if (!input?.description) return 'Task'
        if (input.subagent_type) return `Task [${input.subagent_type}]: ${input.description}`
        return `Task: ${input.description}`
      }
      return part.formatted || toolWithParams(part)
    },

    formatVersion(version) {
      return 'v' + version
    },

    scrollToBottom(force = false) {
      setTimeout(() => scrollMessagesToBottom(force), 50)
    },

    handleTreeClick(event) {
      const node = event.target.closest('.tree-node')
      if (node) {
        const nodeId = node.dataset.nodeId
        if (nodeId) this.selectNode(nodeId)
      }
    },

    async handleTaskClick(part) {
      const sessionId = getTaskSessionId(part)
      if (sessionId) {
        await this.selectNode(sessionId)
      }
    },

    renderTree() {
      if (!this.tree) return ''
      return this.renderNode(this.tree, 0, false, [])
    },

    renderNode(node, depth, isLast, ancestorContinues) {
      const isSelected = node.id === this.selectedNodeId
      const selectedClass = isSelected ? 'selected' : ''
      const statusClass = `status-${node.status || 'idle'}`
      const prefix = getTreePrefix(depth, isLast, ancestorContinues)
      
      let html = `<div class="tree-node ${selectedClass} ${statusClass}" 
                       data-node-id="${node.id}">
                    <span class="node-prefix">${prefix}</span>
                    <span class="node-status"></span>
                    <span class="node-title">${node.title || node.id}</span>
                  </div>`
      
      if (node.children) {
        const childCount = node.children.length
        node.children.forEach((child, index) => {
          const childIsLast = index === childCount - 1
          const newAncestorContinues = [...ancestorContinues, !isLast]
          html += this.renderNode(child, depth + 1, childIsLast, newAncestorContinues)
        })
      }
      
      return html
    }
  }
}
