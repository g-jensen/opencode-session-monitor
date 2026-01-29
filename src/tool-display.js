function params(partInput) {
  let keys = Object.keys(partInput)
  let key_count = keys.length
  let output = ""
  keys.forEach((key, idx) => {
    output += `${key}=${partInput[key]}`
    output += idx < key_count-1 ? "," : ""
  })
  return output
}

function hasStateInput(part) {
  return part.state !== undefined && part.state.input !== undefined
}

function toolWithParams(part) {
  if (hasStateInput(part)) {
    return `${part.tool} [${params(part.state.input)}]`
  }
  return part.tool
}

export function getToolDisplay(part) {
  if (part.tool === 'task') {
    const input = part.state?.input
    if (!input?.description) return 'Task'
    if (input.subagent_type) return `Task [${input.subagent_type}]: ${input.description}`
    return `Task: ${input.description}`
  }
  return part.formatted || toolWithParams(part)
}
