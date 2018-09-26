// cypress + datx needs this fetch polyfill because of the Cypress.on('window:before:load') bug
// (see cypress/support/commands.js)
import 'whatwg-fetch'
import { config } from 'datx-jsonapi'

import ApiStore from './ApiStore'
import RoutingStore from './RoutingStore'
import UiStore from './UiStore'

config.baseUrl = '/api/v1/'
// modify fetch to include 'same-origin' credentials
config.fetchReference = (url, opts) => {
  opts.credentials = 'same-origin'
  return fetch(url, opts)
}

export const routingStore = new RoutingStore()
export const apiStore = new ApiStore()
export const uiStore = new UiStore()

export default {
  routingStore,
  apiStore,
  uiStore,
}
