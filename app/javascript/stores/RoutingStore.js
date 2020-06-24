import _ from 'lodash'
import { RouterStore } from 'mobx-react-router'
import { computed, observable, action } from 'mobx'
import queryString from 'query-string'

import { stringifyUrlParams, loginRedirectPath } from '~/utils/url'
import {
  storeUtmParams,
  utmParamsFromLocation,
} from '~/utils/googleAnalytics/utmUtils'

// mobx-react-router with a couple of helper methods
class RoutingStore extends RouterStore {
  previousPageBeforeSearch = null
  routingTo = { type: null, id: null }

  get uiStore() {
    return this.apiStore.uiStore
  }

  get slug() {
    const { currentOrgSlug } = this.apiStore
    if (currentOrgSlug) return currentOrgSlug
    if (!this.location) return ''

    return _.first(_.compact(this.location.pathname.split('/')))
  }

  @observable
  scrollStates = {} // collection page scroll states

  @computed
  get isSearch() {
    return this.pathContains('/search')
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

  toPathScrollY = collectionId => {
    return this.scrollStates[collectionId] || 0
  }

  @action
  updateScrollState = (collectionId, scrollY) => {
    this.scrollStates[collectionId] = scrollY
  }

  // this gets called when you click the Logo so that it always takes you to the top
  clearHomepageScrollState = () => {
    const { currentUser } = this.apiStore
    if (!currentUser) return
    this.updateScrollState(currentUser.current_user_collection_id, 0)
  }

  pathTo = (type, id = null, params = {}) => {
    const { slug } = this
    switch (type) {
      case 'collections':
        return `/${slug}/collections/${id}`
      case 'items':
        return `/${slug}/items/${id}`
      case 'search':
        // `id` means query in this case
        const path = `/${slug}/search`
        const queryString = id ? `?q=${encodeURIComponent(id)}` : ''
        if (queryString.length > 0) {
          return `${path}${queryString}&${stringifyUrlParams(params)}`
        }
        return path
      case 'admin':
        return '/admin'
      case 'homepage':
      default:
        return `/${slug}`
    }
  }

  setRoutingTo(type, id = null) {
    this.routingTo = { type, id }
  }

  routeTo = (type, id = null, params = {}) => {
    const { uiStore } = this
    const { viewingRecord } = uiStore
    if (
      viewingRecord &&
      viewingRecord.id === id &&
      viewingRecord.internalType === type
    ) {
      // no need to route if we're already on the page
      return
    }

    this.setRoutingTo(type, id)
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
    const { uiStore } = this
    // close the org/roles menus if either are open when we route to a new page
    uiStore.update('organizationMenuPage', null)
    uiStore.update('rolesMenuOpen', null)
    uiStore.setViewingRecord(null)
    uiStore.setEditingCardCover(null)
    uiStore.closeDialog()
  }

  goToPath = path => {
    this.beforeRouting()
    this.push(path)
  }

  pathContains = str => this.location.pathname.indexOf(str) > -1

  updatePreviousPageBeforeSearch(page) {
    const { uiStore } = this
    uiStore.setViewingRecord(null)
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

  get utmQueryParams() {
    return utmParamsFromLocation(this.location)
  }

  routeToLogin = ({ redirect = null } = {}) => {
    // Capture UTM params before redirecting
    storeUtmParams(this.utmQueryParams)
    window.location.href = loginRedirectPath(redirect)
  }

  appendQueryString = queryString => {
    if (!this.history) return false
    this.history.push({
      pathname: this.location.pathname,
      search: queryString,
    })
    return true
  }
}

export default RoutingStore
