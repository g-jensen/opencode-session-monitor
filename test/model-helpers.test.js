import {
  filterModels,
  getModelVariants,
  isDefaultModelSelected,
  isModelSelected,
  hasNoFilteredModels,
  hasVariants,
  isVariantSelected,
  isDefaultVariantSelected,
  getVariantButtonText,
  getModelWithVariant
} from '../src/model-helpers.js'

describe('filterModels', () => {
  const providers = {
    all: [
      { id: 'anthropic', models: { 'claude-3-opus': {name: "Claude Opus", variants: ["high", "max"]}, 'claude-3-sonnet': {name: "Claude Sonnet"} } },
      { id: 'openai', models: { 'gpt-4': {name: "GPT-4"}, 'gpt-3.5-turbo': {name: "GPT-3.5"} } }
    ],
    connected: ['anthropic']
  }

  test('returns all models when query is empty', () => {
    const result = filterModels(providers, '')

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ id: 'anthropic/claude-3-opus', name: "Claude Opus", provider: 'anthropic', model: 'claude-3-opus', variants: ["high", "max"]})
    expect(result).toContainEqual({ id: 'anthropic/claude-3-sonnet', name: "Claude Sonnet", provider: 'anthropic', model: 'claude-3-sonnet' })
    expect(result).not.toContainEqual({ id: 'openai/gpt-4', name: "GPT-4", provider: 'openai', model: 'gpt-4' })
    expect(result).not.toContainEqual({ id: 'openai/gpt-3.5-turbo', name: "GPT-3.5", provider: 'openai', model: 'gpt-3.5-turbo' })
  })

  test('filters models by case-insensitive match on full id', () => {
    const result = filterModels(providers, 'CLAUDE')

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ id: 'anthropic/claude-3-opus', name: "Claude Opus", provider: 'anthropic', model: 'claude-3-opus', variants: ["high", "max"] })
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
    expect(getModelVariants({variants: {"high": "blah", "low": "trees"}})).toEqual(['high', 'low'])
  })

  test('returns empty array for model with no variants', () => {
    expect(getModelVariants({variants: {}})).toEqual([])
  })

  test('returns empty array when model is null', () => {
    expect(getModelVariants(null)).toEqual([])
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
