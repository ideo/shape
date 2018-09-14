import { config } from "datx-jsonapi"

import ApiStore from "./ApiStore"
import NetworkStore from "./NetworkStore"
import RoutingStore from "./RoutingStore"
import UiStore from "./UiStore"

import * as networkModels from "~shared/api.network.v1"

const networkApiTypes = Object.values(networkModels)
  .filter(x => x.type)
  .map(x => x.type)

const getRequestType = url => {
  const segments = url.split("/")
  let typeSegment = segments[segments.length - 1]
  // we want the last segment unless it is an id
  if (typeSegment.match(/^\d+$/)) {
    typeSegment = segments[segments.length - 2]
  }
  // works for foo?bar=baz or foo
  return typeSegment.split("?")[0]
}

const isNetworkType = type => ~networkApiTypes.indexOf(type)

config.baseUrl = "/api/v1/"

config.fetchReference = (url, opts) => {
  const type = getRequestType(url)
  if (isNetworkType(type)) {
    url = url.replace(config.baseUrl, `${window.CONFIG.networkApiBaseUrl}/`)
    opts.credentials = "include"
  } else {
    opts.credentials = "same-origin"
  }
  return fetch(url, opts)
}

config.transformRequest = options => {
  options.options = options.options || {}
  options.options.headers = options.options.headers || {}
  options.options.headers["content-type"] = "application/vnd.api+json"
  options.options.headers["client-id"] = window.CONFIG.clientId
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
  uiStore
}
