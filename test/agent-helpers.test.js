import {
  getAgentButtonText,
  isDefaultAgentSelected,
  isAgentSelected
} from '../src/agent-helpers.js'

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
