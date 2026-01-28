import { buildTree, findNode, detectParallelGroups, addNode } from '../src/core/tree.js'

describe('buildTree', () => {
  test('single root session becomes tree root with empty children', () => {
    const sessions = [
      { id: 'root', parentID: null, title: 'Root Session' }
    ]

    const tree = buildTree(sessions)

    expect(tree.id).toBe('root')
    expect(tree.title).toBe('Root Session')
    expect(tree.children).toEqual([])
  })

  test('nests children under parent', () => {
    const sessions = [
      { id: 'root', parentID: null, title: 'Root' },
      { id: 'child', parentID: 'root', title: 'Child' }
    ]

    const tree = buildTree(sessions)

    expect(tree.children).toHaveLength(1)
    expect(tree.children[0].id).toBe('child')
    expect(tree.children[0].title).toBe('Child')
    expect(tree.children[0].children).toEqual([])
  })

  test('handles session with missing parent gracefully', () => {
    const sessions = [
      { id: 'root', parentID: null, title: 'Root' },
      { id: 'orphan', parentID: 'nonexistent', title: 'Orphan' }
    ]

    const tree = buildTree(sessions)

    expect(tree.id).toBe('root')
    expect(tree.children).toHaveLength(0)
  })

  test('handles parentId (lowercase) field name', () => {
    const sessions = [
      { id: 'root', parentId: null, title: 'Root' },
      { id: 'child', parentId: 'root', title: 'Child' }
    ]

    const tree = buildTree(sessions)

    expect(tree.id).toBe('root')
    expect(tree.children).toHaveLength(1)
    expect(tree.children[0].id).toBe('child')
  })

  test('treats undefined/missing parentId as root', () => {
    const sessions = [
      { id: 'root', title: 'Root' },
      { id: 'child', parentId: 'root', title: 'Child' }
    ]

    const tree = buildTree(sessions)

    expect(tree).not.toBeNull()
    expect(tree.id).toBe('root')
    expect(tree.children).toHaveLength(1)
  })

  test('sorts children by creation time', () => {
    const sessions = [
      { id: 'root', parentID: null, title: 'Root', time: { created: 1000 } },
      { id: 'child-c', parentID: 'root', title: 'C', time: { created: 3000 } },
      { id: 'child-a', parentID: 'root', title: 'A', time: { created: 1000 } },
      { id: 'child-b', parentID: 'root', title: 'B', time: { created: 2000 } }
    ]

    const tree = buildTree(sessions)

    expect(tree.children[0].id).toBe('child-a')
    expect(tree.children[1].id).toBe('child-b')
    expect(tree.children[2].id).toBe('child-c')
  })
})

describe('findNode', () => {
  test('finds deeply nested node by id', () => {
    const tree = {
      id: 'root',
      children: [
        { id: 'child1', children: [] },
        { id: 'child2', children: [
          { id: 'grandchild', children: [] }
        ]}
      ]
    }

    const result = findNode(tree, 'grandchild')

    expect(result).toEqual({ id: 'grandchild', children: [] })
  })

  test('returns null when id is not found', () => {
    const tree = {
      id: 'root',
      children: [
        { id: 'child1', children: [] }
      ]
    }

    const result = findNode(tree, 'nonexistent')

    expect(result).toBeNull()
  })
})

describe('detectParallelGroups', () => {
  test('clusters by timestamp proximity', () => {
    const children = [
      { id: 'a', time: { created: 1000 } },
      { id: 'b', time: { created: 1050 } },
      { id: 'c', time: { created: 5000 } }
    ]

    const groups = detectParallelGroups(children)

    expect(groups[0]).toContain('a')
    expect(groups[0]).toContain('b')
    expect(groups[1]).toContain('c')
  })
})

describe('addNode', () => {
  test('inserts session as child of parent node', () => {
    const tree = {
      id: 'root',
      title: 'Root',
      children: []
    }
    const newSession = { id: 'child1', parentID: 'root', title: 'New Child' }

    addNode(tree, newSession)

    expect(tree.children).toHaveLength(1)
    expect(tree.children[0].id).toBe('child1')
    expect(tree.children[0].title).toBe('New Child')
    expect(tree.children[0].children).toEqual([])
  })

  test('maintains sort order by creation time', () => {
    const tree = {
      id: 'root',
      children: [
        { id: 'child-a', time: { created: 1000 }, children: [] },
        { id: 'child-c', time: { created: 3000 }, children: [] }
      ]
    }
    const session = { id: 'child-b', parentID: 'root', title: 'B', time: { created: 2000 } }

    addNode(tree, session)

    expect(tree.children[0].id).toBe('child-a')
    expect(tree.children[1].id).toBe('child-b')
    expect(tree.children[2].id).toBe('child-c')
    expect(tree.children[1].time.created).toBe(2000)
  })
})
