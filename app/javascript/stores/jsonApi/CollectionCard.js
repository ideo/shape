import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
  get parent() {
    return this.apiStore.find('collections', this.parent_id)
  }

  API_create() {
    return this.apiStore.request('collection_cards', 'POST', { data: this.toJsonApi() })
      .then((response) => {
        const newCard = response.data
        this.parent.collection_cards.push(newCard)
        // NOTE: reordering happens on the frontend; so we perform this extra save...
        // could be replaced by reordering on the backend
        this.parent.API_updateCards()
        // this.apiStore.sync(response)
      })
      .catch((error) => {
        console.warn(error)
      })
  }

  API_duplicate() {
    // This method will increment order of all cards after this one
    return this.apiStore.request(`collection_cards/${this.id}/duplicate`, 'POST')
      .then((response) => {
        // Refresh collection after re-ordering - force reloading
        this.apiStore.fetch('collections', this.parent.id, true)
      })
      .catch((error) => {
        console.warn(error)
      })
  }
}
CollectionCard.type = 'collection_cards'

export default CollectionCard
