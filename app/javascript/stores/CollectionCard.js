import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
  record() {
    if (this.item) {
      return this.item
    } else if (this.collection) {
      return this.collection
    }
    return null
  }
}
CollectionCard.type = 'collection_cards'

export default CollectionCard
