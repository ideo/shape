export function currentScrollPosition() {
  const doc = document.documentElement
  const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
  return top
}

export function setScrollHeight(amount, el = document.documentElement) {
  el.scrollTop = parseInt(amount)
}

export default {
  currentScrollPosition,
  setScrollHeight,
}
