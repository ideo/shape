import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
  API_create() {
    return this.apiStore.request('collection_cards', 'POST', { data: this.toJsonApi() })
      .then((response) => {
        this.apiStore.fetch('collections', this.parent.id, true)
      })
      .catch((error) => {
        console.warn(error)
      })
  }

  API_archive() {
    // eslint-disable-next-line no-alert
    const agree = window.confirm('Are you sure?')
    if (agree) {
      return this.apiStore.request(`collection_cards/${this.id}/archive`, 'PATCH')
        .then((response) => {
          this.apiStore.fetch('collections', this.parent.id, true)
        })
        .catch((error) => {
          console.warn(error)
        })
    }
    return false
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
