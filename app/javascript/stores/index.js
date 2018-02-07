import { config, Store } from 'mobx-jsonapi-store'
import { RouterStore } from 'mobx-react-router'

import User from './User'
import Collection from './Collection'
import Item from './Item'
import CollectionCard from './CollectionCard'

config.baseUrl = '/api/v1/'

export const routingStore = new RouterStore()
// export const collectionStore = CollectionStore.create()

class ApiStore extends Store {}
ApiStore.types = [User, Collection, Item, CollectionCard]

export const apiStore = new ApiStore()

export default {
  routingStore,
  apiStore
}
