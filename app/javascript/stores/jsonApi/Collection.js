import _ from 'lodash'
import BaseRecord from './BaseRecord'

class Collection extends BaseRecord {
  attributesForAPI = ['name']

  // extend standard toJsonApi by adding `order` field onto relationship data
  toJsonApi() {
    const data = super.toJsonApi()
    if (data && data.relationships && data.relationships.collection_cards) {
      _.each(data.relationships.collection_cards.data, card => {
        const cardData = _.find(this.collection_cards, { id: parseInt(card.id) })
        card.order = cardData.order
      })
    }
    return data
  }
  // after we reorder a single card, we want to make sure everything goes into sequential order
  reorderCards() {
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
