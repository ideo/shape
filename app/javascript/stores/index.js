import { config } from 'datx-jsonapi'

import ApiStore from './ApiStore'
import NetworkStore from './NetworkStore'
import RoutingStore from './RoutingStore'
import UiStore from './UiStore'

config.baseUrl = '/api/v1/'
// modify fetch to include 'same-origin' credentials

import * as networkModels from '~shared/api.network.v1'

const networkApiBaseUrl = "https://profile.ideo.com/api/v1"
const networkApiTypes = Object.values(networkModels)
      .filter(x => x.type)
      .map(x => x.type)

const getRequestType = (url) => {
  const match = /.*\/([^\?]*)/.exec(url)
  return match[1]
}

const isNetworkType = (type) => ~networkApiTypes.indexOf(type)

config.fetchReference = (url, opts) => {
  const type = getRequestType(url)
  if (isNetworkType(type)) {
    url = `${networkApiBaseUrl}/${type}`
    opts.credentials = 'include'
  } else {
    opts.credentials = 'same-origin'
  }
  return fetch(url, opts)
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
