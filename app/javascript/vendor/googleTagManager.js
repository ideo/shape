import { apiStore } from '~/stores'

// just a simple wrapper for GTM dataLayer
const googleTagManager = {
  push: params => {
    // always inject currentUserId, organization into params
    params.currentUserId = apiStore.currentUserId
    if (!params.organization) params.organization = apiStore.currentOrgSlug
    if (process.env.DEBUG) {
      // eslint-disable-next-line
      console.log('dataLayer.push', params)
    }
    window.dataLayer = window.dataLayer || []
    return window.dataLayer.push(params)
  },
}

export default googleTagManager
