import { createApiClient as defaultCreateApiClient } from './core/api.js'
import { buildTree } from './core/tree.js'
import { processParts } from './core/messages.js'
import { parseEvent } from './core/events.js'
import { handlePartUpdated, handleSessionCreated, handleSessionUpdated, handleSessionStatus, handleMessageUpdated } from './core/state.js'

import * as partTypes from './part-types.js'
import * as partDisplay from './part-display.js'
import * as sessionHelpers from './session-helpers.js'
import * as modelHelpers from './model-helpers.js'
import * as agentHelpers from './agent-helpers.js'
import * as uiHelpers from './ui-helpers.js'

import {
  scrollMessagesToBottom as defaultScrollMessagesToBottom,
  getScrollPosition as defaultGetScrollPosition,
  setScrollPosition as defaultSetScrollPosition
} from './scroll.js'

import { getToolDisplay } from './tool-display.js'

export function app(deps = {}) {
  const {
    createApiClient = defaultCreateApiClient,
    EventSource = globalThis.EventSource,
    scrollMessagesToBottom = defaultScrollMessagesToBottom,
    getScrollPosition = defaultGetScrollPosition,
    setScrollPosition = defaultSetScrollPosition
  } = deps

  return {
    partTypes,
    partDisplay,
    sessionHelpers,
    modelHelpers,
    agentHelpers,
    uiHelpers,
    getToolDisplay,

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
      return sessionHelpers.filterSessions(this.rootSessions, this.sessionFilter)
    },
    get filteredModels() {
      return modelHelpers.filterModels(this.providers, this.modelFilter)
    },
    get currentModelVariants() {
      return modelHelpers.getModelVariants(this.selectedModel)
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

    formatVersion(version) {
      return 'v' + version
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
    selectedModel: {},
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
        if (this.api.fetchProviders) this.providers = await this.api.fetchProviders()
        if (this.api.fetchConfig) {
          const config = await this.api.fetchConfig()
          if (config.model) {
            this.selectedModel.name = config.model
            this.modelFilter = config.model
          }
          this.agents = Object.keys(config.agent).filter((a) => !config.agent[a].disable)
          this.selectedAgent = this.agents[0]
        }
        if (!this.selectedModel?.name && this.providers?.default?.model) {
          this.selectedModel.name = this.providers.default.model
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
      const model = {providerID: this.selectedModel.provider, modelID: this.selectedModel.modelId}
      if (model.providerID && model.modelID) opts.model = model
      console.log(this.selectedVariant)
      if (this.selectedVariant) opts.variant = this.selectedVariant
      if (Object.keys(opts).length > 0) {
        await this.api.sendMessage(this.selectedNodeId, this.promptInput, opts)
      } else {
        await this.api.sendMessage(this.selectedNodeId, this.promptInput)
      }
      this.promptInput = ''
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
      const sessionId = this.partDisplay.getTaskSessionId(part)
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
      const prefix = uiHelpers.getTreePrefix(depth, isLast, ancestorContinues)
      
      let html = `<div class="tree-node ${selectedClass} ${statusClass}" 
                       data-node-id="${node.id}">
                    <span class="node-prefix">${prefix}</span>
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
