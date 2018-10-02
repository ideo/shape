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
  const networkUrlIndex = url.indexOf(IdeoSSO.baseApiUrl)
  let requestUrl = url
  if (networkUrlIndex > 0) {
    // gross hack, the datx-jsonapi model util saveModel does not read
    // baseUrl, so we have to use endpoint, which when used in
    // saveModel, appends to config.baseUrl, so we end up with a bad
    // url like:
    // "http://localhost:3000/api/v1/https://ideo-sso-profile-staging.herokuapp.com/api/v1/payment_methods"
    // this removes the prefixed config.baseUrl
    //
    // see: https://github.com/infinum/datx/issues/80
    requestUrl = url.slice(networkUrlIndex)
  }
  if (isNetworkUrl(requestUrl)) {
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
