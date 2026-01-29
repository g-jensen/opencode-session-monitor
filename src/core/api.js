function request(baseUrl, path, options) {
  return fetch(baseUrl + path, options)
}

async function requestJson(baseUrl, path, options) {
  const response = await request(baseUrl, path, options)
  return response.json()
}

async function getJson(baseUrl, path, options) {
  return requestJson(baseUrl,path,{ ...options, method: 'GET' })
}

async function postJson(baseUrl, path, options) {
  return requestJson(baseUrl,path,{ ...options, method: 'POST' })
}

export function createApiClient(baseUrl, auth) {
  const options = {}
  if (auth.apiKey) {
    const headerName = auth.apiKeyHeader || 'X-API-Key'
    options.headers = { [headerName]: auth.apiKey }
  }

  return {
    fetch: (path) => request(baseUrl, path, options),
    fetchHealth: () => getJson(baseUrl, '/global/health', options),
    fetchSessions: () => getJson(baseUrl, '/session', options),
    fetchSessionChildren: (id) => getJson(baseUrl, `/session/${id}/children`, options),
    fetchMessages: (id) => getJson(baseUrl, `/session/${id}/message`, options),
    abortSession: (id) => postJson(baseUrl, `/session/${id}/abort`, options),
    fetchProviders: () => getJson(baseUrl, '/provider', options),
    fetchConfig: () => getJson(baseUrl, '/config', options),
    sendMessage: (sessionId, text, opts = {}) => request(baseUrl, `/session/${sessionId}/prompt_async`, {
      ...options,
      method: 'POST',
      headers: { ...options.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        parts: [{ type: 'text', text }],
        ...opts
      })
    })
  }
}
