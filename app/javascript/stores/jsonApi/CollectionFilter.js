import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class CollectionFilter extends BaseRecord {
  static type = 'collection_filters'
  static endpoint = apiUrl('collection_filters')

  attributesForAPI = ['filter_type', 'text', 'selected']

  API_toggleSelected(selected) {
    const action = selected ? 'select' : 'unselect'
    this.apiStore.request(`collection_filters/${this.id}/${action}`, 'POST')
  }
}

export default CollectionFilter
