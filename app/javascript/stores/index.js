import { config } from 'datx-jsonapi'
import ApiStore from './ApiStore'
import NetworkStore from './NetworkStore'
import RoutingStore from './RoutingStore'
import UiStore from './UiStore'
import UndoStore from './UndoStore'

const isNetworkUrl = url => url.indexOf(IdeoSSO.baseApiUrl) > -1

// important, see https://github.com/infinum/datx/issues/80
// set to / instead of empty string to avoid situations like:
// /:org-name/foo/1/api/v1/
config.baseUrl = '/'

config.fetchReference = (url, opts) => {
  let requestUrl = url
  if (isNetworkUrl(requestUrl)) {
    // remove baseUrl / if it is at the start of a network url
    // (happens when using utils saveModel / removeModel)
    requestUrl = url.replace(/^\//, '')
    opts.credentials = 'include'
  } else {
    opts.credentials = 'same-origin'
  }
  return fetch(requestUrl, opts)
}

config.transformRequest = options => {
  options.options = options.options || {}
  options.options.headers = options.options.headers || {}
  options.options.headers['content-type'] = 'application/vnd.api+json'
  options.options.headers['client-id'] = window.CONFIG.clientId
  return options
}

export const networkStore = new NetworkStore()
export const routingStore = new RoutingStore()
export const uiStore = new UiStore()
export const undoStore = new UndoStore()
// apiStore acts as a middleman for supplying other stores to models
export const apiStore = new ApiStore({ routingStore, uiStore, undoStore })

export default {
  apiStore,
  networkStore,
  routingStore,
  uiStore,
  undoStore,
}
