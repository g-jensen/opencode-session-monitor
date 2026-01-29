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
