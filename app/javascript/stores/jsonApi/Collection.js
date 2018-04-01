import _ from 'lodash'
import { computed, action } from 'mobx'

import { uiStore } from '~/stores'
import { archive } from './shared'
import BaseRecord from './BaseRecord'

class Collection extends BaseRecord {
  attributesForAPI = ['name', 'tag_list']

  @computed get cardIds() {
    return this.collection_cards.map(card => card.id)
  }

  @action emptyCards() {
    this.collection_cards.replace([])
    uiStore.openBlankContentTool()
  }

  checkResponseForEmptyCards(response) {
    /*
      NOTE: if a collection goes from having cards to having an empty array of cards
      (e.g. those cards were moved out, archived, etc)
      then jsonapi-store seems to ignore the change, so we have to empty cards manually
    */
    const rawData = response.__response.data.data
    if (!rawData && !rawData.relationships.collection_cards) return
    if (_.isEmpty(rawData.relationships.collection_cards.data)) {
      this.emptyCards()
    }
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
    return archive('collections', this)
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
        card.order = i + 1
      })
    }
    return false
  }
}
Collection.type = 'collections'

Collection.defaults = {
  // set as array so it's never `undefined`
  collection_cards: [],
  roles: []
}

export default Collection
