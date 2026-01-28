import { applyDelta, processParts, formatToolCall } from '../src/core/messages.js'

describe('applyDelta', () => {
  test('appends delta to content', () => {
    const result = applyDelta('Hello', ' World')

    expect(result).toBe('Hello World')
  })
})

describe('processParts', () => {
  test('returns text parts with their content', () => {
    const parts = [{ type: 'text', content: 'Hello' }]

    const result = processParts(parts)

    expect(result).toEqual([{ type: 'text', content: 'Hello' }])
  })

  test('adds formatted field to tool-invocation parts', () => {
    const parts = [{ type: 'tool-invocation', name: 'read_file', input: { path: '/app.js' } }]

    const result = processParts(parts)

    expect(result[0].formatted).toBe('read_file({"path":"/app.js"})')
  })

  test('adds formatted field to multiple parts', () => {
    const part1 = { type: 'tool-invocation', name: 'read_file', input: { path: '/app.js' }}
    const part2 = { type: 'tool-invocation', name: 'read_file', input: { path: '/other.js' }}
    const parts = [part1, part2]

    const result = processParts(parts)

    expect(result[0].formatted).toBe('read_file({"path":"/app.js"})')
    expect(result[1].formatted).toBe('read_file({"path":"/other.js"})')
  })

  test('defaults parts without type to text', () => {
    const parts = [
      { content: 'Hello world' }
    ]

    const result = processParts(parts)

    expect(result[0].type).toBe('text')
    expect(result[0].content).toBe('Hello world')
  })

  test('normalizes text field to content', () => {
    const parts = [
      { type: 'text', text: 'Hello world' }
    ]

    const result = processParts(parts)

    expect(result[0].content).toBe('Hello world')
  })
})

describe('formatToolCall', () => {
  test('formats tool invocation with name and stringified input', () => {
    const part = {
      type: 'tool-invocation',
      name: 'read_file',
      input: { path: '/src/app.js' }
    }

    const result = formatToolCall(part)

    expect(result).toBe('read_file({"path":"/src/app.js"})')
  })
})
