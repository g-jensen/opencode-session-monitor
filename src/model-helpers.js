export function filterModels(providers, query) {
  if (!providers) return []
  const connectedSet = providers.connected ? new Set(providers.connected) : null
  const models = []
  for (const provider of providers.all || []) {
    if (connectedSet && !connectedSet.has(provider.id)) continue
    for (const modelKey of Object.keys(provider.models || {})) {
      const model = provider.models[modelKey]
      const id = `${provider.id}/${modelKey}`
      models.push({...model, id, provider: provider.id, model: modelKey, modelId: model.id })
    }
  }
  if (!query) return models
  const q = query.toLowerCase()
  return models.filter(m => m.name.toLowerCase().includes(q))
}

export function getModelVariants(selectedModel) {
  if (selectedModel?.variants) {
    return Object.keys(selectedModel.variants)
  }
  return []
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
