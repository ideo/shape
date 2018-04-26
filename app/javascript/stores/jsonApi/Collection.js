import _ from 'lodash'
import { computed } from 'mobx'

import Api from './Api'
import BaseRecord from './BaseRecord'
import {uiStore} from '~/stores'

class Collection extends BaseRecord {
  attributesForAPI = ['name', 'tag_list']

  @computed get cardIds() {
    return this.collection_cards.map(card => card.id)
  }

  get isUserCollection() {
    return this.type === 'Collection::UserCollection'
  }

  get isSharedCollection() {
    return this.type === 'Collection::SharedWithMeCollection'
  }

  get isNormalCollection() {
    return !this.isUserCollection && !this.isSharedCollection
  }

  API_archive() {
    return Api.archive('collections', this)
  }

  API_duplicate() {
    return Api.duplicate('collections', this)
  }

  API_updateCards() {
    this._reorderCards()
    const data = this.toJsonApi()
    delete data.relationships
    // attach nested attributes of cards
    data.attributes.collection_cards_attributes = _.map(this.collection_cards, card => (
      _.pick(card, ['id', 'order', 'width', 'height'])
    ))
    const apiPath = `collections/${this.id}`
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  // after we reorder a single card, we want to make sure everything goes into sequential order
  _reorderCards() {
    if (this.collection_cards) {
      return _.each(_.sortBy(this.collection_cards, 'order'), (card, i) => {
        card.order = i
      })
    }
    return false
  }

  checkCurrentOrg(itemId) {
    if (!this.apiStore.currentUser) return
    if (this.organization_id !==
        this.apiStore.currentUser.current_organization.id) {
      const routing = {
        routeToItemId: itemId,
        routeToCollectionId: this.id,
      }
      this.apiStore.currentUser.switchOrganization(
        this.organization_id,
        routing,
      )
    }
  }
}
Collection.type = 'collections'

Collection.defaults = {
  // set as array so it's never `undefined`
  collection_cards: [],
  roles: []
}

export default Collection
