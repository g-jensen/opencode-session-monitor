import { getToolDisplay } from '../src/tool-display.js'

describe('getToolDisplay', () => {
  test('returns formatted when present', () => {
    expect(getToolDisplay({ formatted: 'ls -la', tool: 'bash' })).toBe('ls -la')
  })

  test('returns tool name when formatted missing', () => {
    expect(getToolDisplay({ tool: 'bash' })).toBe('bash')
  })

  test('returns tool name when input missing', () => {
    expect(getToolDisplay({ tool: 'bash', state: {status: "running"}})).toBe('bash')
  })

  test('returns tool name with input when present', () => {
    expect(getToolDisplay({ tool: 'bash', state: {input: {name: "param"}}})).toBe('bash [name=param]')
  })

  test('returns tool name with input with multiple params', () => {
    expect(getToolDisplay({ tool: 'bash', state: {input: {name: "param", other: "hi"}}})).toBe('bash [name=param,other=hi]')
  })

  test('returns Task with subagent_type and description', () => {
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
    expect(getToolDisplay(part)).toBe('Task [red]: Write failing test')
  })

  test('returns Task with description only when no subagent_type', () => {
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
    expect(getToolDisplay(part)).toBe('Task: Analyze codebase')
  })

  test('returns Task when no input provided', () => {
    const part = {
      type: 'tool',
      tool: 'task',
      state: {}
    }
    expect(getToolDisplay(part)).toBe('Task')
  })
})
