import { RouterStore } from 'mobx-react-router'

import AuthStore from '~/stores/AuthStore'
import CollectionStore from '~/stores/CollectionStore'

export const routingStore = new RouterStore()
export const authStore = AuthStore.create()
export const collectionStore = CollectionStore.create()

export default {
  routingStore,
  authStore,
  collectionStore,
}
