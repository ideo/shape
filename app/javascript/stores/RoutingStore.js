import { RouterStore } from 'mobx-react-router'
import { computed, observable, action } from 'mobx'
import queryString from 'query-string'

import { apiStore, uiStore } from '~/stores'
import { stringifyUrlParams } from '~/utils/url'

// mobx-react-router with a couple of helper methods
class RoutingStore extends RouterStore {
  previousPageBeforeSearch = null
  routingTo = { type: null, id: null }

  slug = () => apiStore.currentOrgSlug

  @observable
  scrollStates = []

  @computed
  get isSearch() {
    return this.location.pathname.includes('search')
  }

  @computed
  get isAdmin() {
    return this.location.pathname === this.pathTo('admin')
  }

  @computed
  get query() {
    return queryString.parse(this.location.search)
  }

  @computed
  get extraSearchParams() {
    if (!this.isSearch) return {}
    const params = queryString.parse(this.location.search)
    delete params.q
    return params
  }

  @computed
  get hasPathWithScrollState() {
    const pathNames = this.scrollStates.map(s => s.path.pathname)
    return pathNames.findIndex(p => p === this.location.pathname) > -1
  }

  @computed
  get toPathScrollY() {
    const pathNames = this.scrollStates.map(s => s.path.pathname)
    const toPathIndex = pathNames.findIndex(p => p === this.location.pathname)
    return toPathIndex > -1 ? this.scrollStates[toPathIndex].scrollY : 0
  }

  @action.bound // see: https://mobx.js.org/refguide/action.html
  updateScrollState(path, scrollY) {
    const pathNames = this.scrollStates.map(s => s.path.pathname)
    const routeFromPathIndex = pathNames.findIndex(p => p === path.pathname)
    if (routeFromPathIndex > -1) {
      this.scrollStates[routeFromPathIndex].scrollY = scrollY
    } else {
      this.scrollStates.push({ path: path, scrollY: scrollY })
    }
  }

  pathTo = (type, id = null, params = {}) => {
    switch (type) {
      case 'collections':
        return `/${this.slug()}/collections/${id}`
      case 'items':
        return `/${this.slug()}/items/${id}`
      case 'search':
        // `id` means query in this case
        const path = `/${this.slug()}/search`
        const qs = id ? `?q=${encodeURIComponent(id)}` : ''
        return `${path}${qs}&${stringifyUrlParams(params)}`
      case 'admin':
        return '/admin'
      case 'homepage':
      default:
        return `/${this.slug()}`
    }
  }

  routeTo = (type, id = null, params = {}) => {
    this.routingTo = { type, id }

    // prevent accidental route changes while you are dragging/moving into collection
    if (uiStore.movingIntoCollection) {
      return
    }
    this.beforeRouting()
    if (!id && type !== 'homepage' && type !== 'search') {
      // in this case, type is a path like '/' or '/terms'
      this.push(type)
      return
    }
    if (type === 'search') {
      this.updatePreviousPageBeforeSearch(this.location)
    }
    const path = this.pathTo(type, id, params)
    this.push(path)
  }

  beforeRouting() {
    // close the org/roles menus if either are open when we route to a new page
    uiStore.update('organizationMenuPage', null)
    uiStore.update('rolesMenuOpen', null)
    uiStore.setViewingCollection(null)
    uiStore.closeDialog()
  }

  goToPath = path => {
    this.beforeRouting()
    this.push(path)
  }

  pathContains = str => this.location.pathname.indexOf(str) > -1

  updatePreviousPageBeforeSearch(page) {
    uiStore.setViewingCollection(null)
    if (page.pathname.indexOf('/search') === -1) {
      this.previousPageBeforeSearch = page.pathname
    }
  }

  leaveSearch = () => {
    if (!this.isSearch) return
    if (this.previousPageBeforeSearch) {
      this.routeTo(this.previousPageBeforeSearch)
    } else {
      this.routeTo('/')
    }
  }
}

export default RoutingStore
