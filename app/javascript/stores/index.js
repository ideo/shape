import { Store } from 'mobx-jsonapi-store'
import { RouterStore } from 'mobx-react-router'

import User from './User'
import Collection from './Collection'
import CollectionCard from './CollectionCard'

export const routingStore = new RouterStore()
// export const collectionStore = CollectionStore.create()

class ApiStore extends Store {}
ApiStore.types = [User, Collection, CollectionCard]

export const apiStore = new ApiStore()

export default {
  routingStore,
  apiStore
}
