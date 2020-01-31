import { apiStore, uiStore } from '~/stores'

// just a simple wrapper for GTM dataLayer
const googleTagManager = {
  push(params) {
    // always inject organization (slug), currentUserId, objectIdentifier into params
    const allParams = Object.assign(params, this.defaultParams())
    if (process.env.DEBUG) {
      // eslint-disable-next-line
      console.log('dataLayer.push', allParams)
    }
    window.dataLayer = window.dataLayer || []
    return window.dataLayer.push(allParams)
  },
  defaultParams() {
    const params = {
      organization: apiStore.currentOrgSlug,
      currentUserId: apiStore.currentUserId,
    }
    if (uiStore.viewingCollection) {
      params.viewingObjectType = 'collection'
      params.viewingObjectId = uiStore.viewingCollection.id
    } else if (uiStore.viewingItem) {
      params.viewingObjectType = 'item'
      params.viewingObjectId = uiStore.viewingItem.id
    }
    return params
  },
}

export default googleTagManager
