import { RouterStore } from 'mobx-react-router'
import { apiStore, uiStore } from '~/stores'

// mobx-react-router with a couple of helper methods
class RoutingStore extends RouterStore {
  previousPageBeforeSearch = null

  slug = () => apiStore.currentOrgSlug

  pathTo = (type, id = null) => {
    switch (type) {
      case 'collections':
        return `/${this.slug()}/collections/${id}`
      case 'items':
        return `/${this.slug()}/items/${id}`
      case 'search':
        // `id` means query in this case
        // if no query, then go back to homepage (e.g. clearing out your search)
        if (!id) return this.pathTo('homepage')
        return `/${this.slug()}/search?q=${id.replace(/\s/g, '+')}`
      case 'homepage':
        return `/${this.slug()}`
      default:
        return ''
    }
  }

  routeTo = (type, id = null) => {
    // close the org/roles menus if either are open when we route to a new page
    uiStore.update('organizationMenuPage', null)
    uiStore.update('rolesMenuOpen', null)
    if (!id && type !== 'homepage') {
      // in this case, type is a path like '/' or '/terms'
      this.push(type)
      return
    }
    if (type === 'search') this.updatePreviousPageBeforeSearch(this.location)
    const path = this.pathTo(type, id)
    this.push(path)
  }

  pathContains = str => this.location.pathname.indexOf(str) > -1

  updatePreviousPageBeforeSearch(page) {
    if (page.pathname.indexOf('/search') === -1) {
      this.previousPageBeforeSearch = page.pathname
    }
  }

  leaveSearch = () => {
    if (this.previousPageBeforeSearch) {
      this.routeTo(this.previousPageBeforeSearch)
    } else {
      this.routeTo('/')
    }
  }
}

export default RoutingStore
