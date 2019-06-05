import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Dataset extends SharedRecordMixin(BaseRecord) {
  static type = 'datasets'
  static endpoint = apiUrl('datasets')

  get identifier() {
    this.rawAttributes().identifier
  }
}

export default Dataset
