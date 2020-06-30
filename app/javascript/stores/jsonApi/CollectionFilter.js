import { action } from 'mobx'

import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class CollectionFilter extends BaseRecord {
  static type = 'collection_filters'
  static endpoint = apiUrl('collection_filters')

  attributesForAPI = ['filter_type', 'text', 'selected']

  @action
  API_toggleSelected(collection, selected) {
    const action = selected ? 'select' : 'unselect'
    // mark that the cards need refetching now that the filters have changed
    collection.storedCacheKey = null
    return this.apiStore.request(
      `collection_filters/${this.id}/${action}`,
      'POST'
    )
  }
}

export default CollectionFilter
