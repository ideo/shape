import { config } from 'datx-jsonapi'

import ApiStore from './ApiStore'
import RoutingStore from './RoutingStore'
import UiStore from './UiStore'
import UndoStore from './UndoStore'

config.baseUrl = '/api/v1/'
// modify fetch to include 'same-origin' credentials
config.fetchReference = (url, opts) => {
  opts.credentials = 'same-origin'
  return fetch(url, opts)
}

export const routingStore = new RoutingStore()
export const apiStore = new ApiStore()
export const uiStore = new UiStore()
export const undoStore = new UndoStore()

export default {
  routingStore,
  apiStore,
  uiStore,
  undoStore,
}
