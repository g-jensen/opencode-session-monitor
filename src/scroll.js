export function scrollMessagesToBottom(force = false) {
  const container = document.querySelector('.messages')
  if (!container) return
  const threshold = 50
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  if (force || isNearBottom) {
    container.scrollTop = container.scrollHeight
  }
}

export function getScrollPosition() {
  const container = document.querySelector('.messages')
  return container ? container.scrollTop : 0
}

export function setScrollPosition(position) {
  const container = document.querySelector('.messages')
  if (container) {
    container.scrollTop = position
  }
}
