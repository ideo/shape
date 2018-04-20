import { RouterStore } from 'mobx-react-router'

// mobx-react-router with a couple of helper methods
class RoutingStore extends RouterStore {
  pathTo = (type, id) => {
    switch (type) {
    case 'collections':
      return `/collections/${id}`
    case 'items':
      return `/items/${id}`
    case 'search':
      // `id` means query in this case
      // if no query, then go back to homepage (e.g. clearing out your search)
      if (!id) return '/'
      return `/search?q=${id.replace(/\s/g, '+')}`
    default:
      return ''
    }
  }

  routeTo = (type, id) => {
    if (type === '/') {
      this.push('/')
      return
    }
    const path = this.pathTo(type, id)
    this.push(path)
  }

  pathContains = (str) => (
    this.location.pathname.indexOf(str) > -1
  )
}

export default RoutingStore
