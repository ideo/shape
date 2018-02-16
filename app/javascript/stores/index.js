import { config as jsonApiConfig } from 'mobx-jsonapi-store'
import { RouterStore } from 'mobx-react-router'

import locale from './Locale'
import ApiStore from './ApiStore'
import UiStore from './UiStore'

jsonApiConfig.baseUrl = '/api/v1/'
// modify fetch to include 'same-origin' credentials
jsonApiConfig.fetchReference = (url, opts) => {
  opts.credentials = 'same-origin'
  return fetch(url, opts)
}

export const routingStore = new RouterStore()
export const apiStore = new ApiStore()
export const uiStore = new UiStore()

export default {
  routingStore,
  apiStore,
  uiStore,
  // needs to be named "locale"
  locale
}
