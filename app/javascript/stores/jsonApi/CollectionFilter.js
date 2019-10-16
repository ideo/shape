import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class CollectionFilter extends BaseRecord {
  static type = 'collection_filters'
  static endpoint = apiUrl('collection_filters')

  attributesForAPI = ['filter_type', 'text', 'selected']
}

export default CollectionFilter
