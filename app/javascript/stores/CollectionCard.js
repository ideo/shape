import { Record } from 'mobx-jsonapi-store'

class CollectionCard extends Record {
  record = () => {
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
