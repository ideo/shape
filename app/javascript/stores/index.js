// cypress + datx needs this fetch polyfill because of the Cypress.on('window:before:load') bug
// (see cypress/support/commands.js)
import 'whatwg-fetch'
import { config } from 'datx-jsonapi'
import ApiStore from './ApiStore'
import NetworkStore from './NetworkStore'
import RoutingStore from './RoutingStore'
import UiStore from './UiStore'

const isNetworkUrl = url => url.indexOf(IdeoSSO.baseApiUrl) === 0

config.baseUrl = '/api/v1/'

config.fetchReference = (url, opts) => {
  if (isNetworkUrl(url)) {
    opts.credentials = 'include'
  } else {
    opts.credentials = 'same-origin'
  }
  return fetch(url, opts)
}

config.transformRequest = options => {
  options.options = options.options || {}
  options.options.headers = options.options.headers || {}
  options.options.headers['content-type'] = 'application/vnd.api+json'
  options.options.headers['client-id'] = window.CONFIG.clientId
  return options
}

export const apiStore = new ApiStore()
export const networkStore = new NetworkStore()
export const routingStore = new RoutingStore()
export const uiStore = new UiStore()

export default {
  apiStore,
  networkStore,
  routingStore,
  uiStore,
}
