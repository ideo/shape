import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class TestAudience extends BaseRecord {
  static type = 'test_audiences'
  static endpoint = apiUrl('test_audiences')

  attributesForAPI = ['sample_size', 'audience_id', 'test_collection_id']
}
TestAudience.defaults = {
  sample_size: 0,
}

export default TestAudience
