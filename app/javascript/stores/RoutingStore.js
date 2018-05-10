import { RouterStore } from 'mobx-react-router'

// mobx-react-router with a couple of helper methods
class RoutingStore extends RouterStore {
  updatePreviousPageBeforeSearch(page) {
    if (page.pathname !== '/search') {
      this.previousPageBeforeSearch = page.pathname
    }
  }

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
      this.updatePreviousPageBeforeSearch(this.location)
      return `/search?q=${id.replace(/\s/g, '+')}`
    default:
      return ''
    }
  }

  routeTo = (type, id = null) => {
    if (!id) {
      // in this case, type is a path like '/' or '/terms'
      this.push(type)
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
