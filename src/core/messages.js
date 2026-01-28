export function applyDelta(content, delta) {
  return content + delta
}

export function processParts(parts) {
  return parts.map(part => {
    const normalizedPart = { ...part, type: part.type || 'text', content: part.content || part.text }
    if (normalizedPart.type === 'tool-invocation') {
      return { ...normalizedPart, formatted: formatToolCall(normalizedPart) }
    }
    return normalizedPart
  })
}

export function formatToolCall(part) {
  return `${part.name}(${JSON.stringify(part.input)})`
}
