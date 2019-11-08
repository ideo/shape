import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Dataset extends SharedRecordMixin(BaseRecord) {
  static type = 'datasets'
  static endpoint = apiUrl('datasets')

  get identifier() {
    this.rawAttributes().identifier
  }

  get data() {
    return this.rawAttributes().data.map(datum => {
      if (datum.date) {
        datum.date = new Date(datum.date)
      }
      return datum
    })
  }
}

export default Dataset
