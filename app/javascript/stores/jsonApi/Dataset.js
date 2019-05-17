import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Dataset extends SharedRecordMixin(BaseRecord) {
  static type = 'datasets'
  static endpoint = apiUrl('datasets')

  API_toggleSelected({ collectionId }) {
    return this.apiStore.request(
      `collections/${collectionId}/datasets/${this.id}/toggle_selected`,
      'POST'
    )
  }
}

export default Dataset
