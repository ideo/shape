import _ from 'lodash'
import BaseRecord from './BaseRecord'

class Collection extends BaseRecord {
  attributesForAPI = ['name']

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
      .then((response) => {
        this.apiStore.sync(response)
      })
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
  collection_cards: []
}

export default Collection
