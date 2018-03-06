import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
  get parent() {
    return this.apiStore.find('collections', this.parent_id)
  }

  API_archive() {
    // eslint-disable-next-line no-alert
    const agree = window.confirm('Are you sure?')
    if (agree) {
      return this.apiStore.request(`collection_cards/${this.id}/archive`, 'PATCH')
        .then((response) => {
          this.parent.collection_cards.remove(this)
          // TODO: replace with backend reordering
          this.parent.API_updateCards()
        })
    }
    return false
  }

  API_create() {
    // we call apiStore.request so we can interact with the response data
    // the normal .save() doesn't pass it through
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
}
CollectionCard.type = 'collection_cards'

export default CollectionCard
