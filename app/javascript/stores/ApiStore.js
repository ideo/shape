import { action, observable, computed } from 'mobx'
import { Store } from 'mobx-jsonapi-store'

import User from './jsonApi/User'
import Collection from './jsonApi/Collection'
import Item from './jsonApi/Item'
import CollectionCard from './jsonApi/CollectionCard'

class ApiStore extends Store {
  @observable currentUserId = null

  @action setCurrentUserId(id) {
    this.currentUserId = id
  }

  @computed get currentUser() {
    return this.find('users', this.currentUserId)
  }
}
ApiStore.types = [User, Collection, Item, CollectionCard]

export default ApiStore
