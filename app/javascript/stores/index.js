import { config as jsonApiConfig } from 'mobx-jsonapi-store'

import ApiStore from './ApiStore'
import RoutingStore from './RoutingStore'
import UiStore from './UiStore'

jsonApiConfig.baseUrl = '/api/v1/'
// modify fetch to include 'same-origin' credentials
jsonApiConfig.fetchReference = (url, opts) => {
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
