import { routingStore } from '~/stores'
import { storeUtmParams } from '~/utils/googleAnalytics/utmUtils'

export const loginRedirectPath = (redirect = null) => {
  let path = '/login'
  if (redirect) {
    path += `?redirect=${encodeURI(redirect)}`
  }
  return path
}

export const routeToLogin = ({ redirect = null } = {}) => {
  // Capture UTM params before redirecting
  storeUtmParams(routingStore.utmQueryParams)
  window.location.href = loginRedirectPath(redirect)
}

export default routeToLogin
