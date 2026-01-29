export function getAgentButtonText(selectedAgent) {
  return selectedAgent || 'Agent'
}

export function isDefaultAgentSelected(selectedAgent) {
  return !selectedAgent
}

export function isAgentSelected(agent, selectedAgent) {
  return agent.name === selectedAgent
}
