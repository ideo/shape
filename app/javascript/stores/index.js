import { config as jsonApiConfig, Store } from 'mobx-jsonapi-store'
import { RouterStore } from 'mobx-react-router'

import locale from './Locale'
import User from './User'
import Collection from './Collection'
import Item from './Item'
import CollectionCard from './CollectionCard'

jsonApiConfig.baseUrl = '/api/v1/'
// modify fetch to include 'same-origin' credentials
jsonApiConfig.fetchReference = (url, opts) => {
  opts.credentials = 'same-origin'
  return fetch(url, opts)
}

export const routingStore = new RouterStore()

class ApiStore extends Store {}
ApiStore.types = [User, Collection, Item, CollectionCard]

export const apiStore = new ApiStore()

export default {
  routingStore,
  apiStore,
  // needs to be named "locale"
  locale
}
