import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class DataItemsDataset extends SharedRecordMixin(BaseRecord) {
  static type = 'data_items_datasets'
  static endpoint = apiUrl('data_items_datasets')
}

export default DataItemsDataset
