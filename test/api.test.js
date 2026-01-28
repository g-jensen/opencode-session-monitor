import { createApiClient } from '../src/core/api.js'

describe('createApiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('fetch calls global fetch with full URL', async () => {
    fetch.mockResolvedValue({ ok: true })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    await client.fetch('/users')

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object))
  })

  test('fetch includes API key header when apiKey is provided', async () => {
    fetch.mockResolvedValue({ ok: true })

    const client = createApiClient('https://api.example.com', { apiKey: 'secret-key-123' })

    await client.fetch('/users')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'secret-key-123'
        })
      })
    )
  })

  test('fetch uses custom header name when apiKeyHeader is provided', async () => {
    fetch.mockResolvedValue({ ok: true })

    const client = createApiClient('https://api.example.com', {
      apiKey: 'secret-key-123',
      apiKeyHeader: 'Authorization'
    })

    await client.fetch('/users')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'secret-key-123'
        })
      })
    )
  })

  test('fetchHealth fetches /global/health and returns parsed JSON', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0' })
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchHealth()

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/global/health', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual({ version: '1.0.0' })
  })

  test('fetchSessions fetches /session and returns parsed JSON', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sess1', title: 'Session 1' }])
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchSessions()

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/session', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([{ id: 'sess1', title: 'Session 1' }])
  })

  test('fetchSessionChildren fetches /session/:id/children and returns parsed JSON', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'child1', parentId: 'sess123' }])
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchSessionChildren('sess123')

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/session/sess123/children', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([{ id: 'child1', parentId: 'sess123' }])
  })

  test('fetchMessages fetches /session/:id/message and returns parsed JSON', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'msg1', content: 'Hello' }])
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchMessages('sess123')

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/session/sess123/message', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([{ id: 'msg1', content: 'Hello' }])
  })

  test('abortSession posts to /session/:id/abort and returns parsed JSON', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'aborted' })
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.abortSession('sess123')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/session/sess123/abort',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result).toEqual({ status: 'aborted' })
  })

  test('sendMessage posts to /session/:id/prompt_async with correct body', async () => {
    fetch.mockResolvedValue({ ok: true })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    await client.sendMessage('sess123', 'Hello, world!')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/session/sess123/prompt_async',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ parts: [{ type: 'text', text: 'Hello, world!' }] })
      })
    )
  })

  test('fetchAgents fetches /agent and returns parsed JSON', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'agent1', description: 'First agent' }])
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchAgents()

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/agent', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([{ name: 'agent1', description: 'First agent' }])
  })

  test('fetchProviders fetches /provider and returns parsed JSON', async () => {
    const providerData = {
      all: [{ name: 'openai', models: ['gpt-4'] }],
      default: { name: 'openai' },
      connected: ['openai']
    }
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(providerData)
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchProviders()

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/provider', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual(providerData)
  })

  test('fetchConfig fetches /config and returns parsed JSON', async () => {
    const configData = {
      model: 'anthropic/claude-sonnet-4-5',
      theme: 'opencode'
    }
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(configData)
    })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    const result = await client.fetchConfig()

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/config', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual(configData)
  })

  test('sendMessage includes agent in body when provided', async () => {
    fetch.mockResolvedValue({ ok: true })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    await client.sendMessage('sess123', 'Hello!', { agent: 'custom-agent' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/session/sess123/prompt_async',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          parts: [{ type: 'text', text: 'Hello!' }],
          agent: 'custom-agent'
        })
      })
    )
  })

  test('sendMessage includes model in body when provided', async () => {
    fetch.mockResolvedValue({ ok: true })

    const client = createApiClient('https://api.example.com', { apiKey: null })

    await client.sendMessage('sess123', 'Hello!', { model: 'gpt-4' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/session/sess123/prompt_async',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          parts: [{ type: 'text', text: 'Hello!' }],
          model: 'gpt-4'
        })
      })
    )
  })
})
