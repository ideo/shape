import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class DataItemsDatasets extends SharedRecordMixin(BaseRecord) {
  static type = 'data_items_datasets'
  static endpoint = apiUrl('data_items_datasets')
}

export default DataItemsDatasets
