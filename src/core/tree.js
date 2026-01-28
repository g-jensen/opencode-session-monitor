export function findNode(tree, id) {
  if (tree.id === id) return tree
  for (const child of tree.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function detectParallelGroups(children) {
  const sorted = [...children].sort((a, b) => a.time.created - b.time.created)
  const groups = []
  let currentGroup = []
  let lastTimestamp = null

  for (const child of sorted) {
    const startsNewGroup = currentGroup.length > 0 && child.time.created - lastTimestamp >= 500
    if (startsNewGroup) {
      groups.push(currentGroup)
      currentGroup = []
    }
    currentGroup.push(child.id)
    lastTimestamp = child.time.created
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

export const getParentId = (session) => session.parentID ?? session.parentId ?? null

export function addNode(tree, session) {
  const parent = findNode(tree, getParentId(session))
  parent.children.push({ id: session.id, title: session.title, time: session.time, children: [] })
  parent.children.sort((a, b) => a.time.created - b.time.created)
}

function sortChildrenByTime(node) {
  node.children.sort((a, b) => a.time.created - b.time.created)
  for (const child of node.children) {
    sortChildrenByTime(child)
  }
}

export function buildTree(sessions) {
  const nodeMap = {}
  
  for (const session of sessions) {
    nodeMap[session.id] = { id: session.id, title: session.title, time: session.time, children: [] }
  }
  
  let root = null
  for (const session of sessions) {
    const parentId = getParentId(session)
    if (parentId === null) {
      root = nodeMap[session.id]
    } else if (nodeMap[parentId]) {
      nodeMap[parentId].children.push(nodeMap[session.id])
    }
  }
  
  if (root) {
    sortChildrenByTime(root)
  }
  
  return root
}
