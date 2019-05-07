import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class TestAudience extends BaseRecord {
  static type = 'test_audiences'
  static endpoint = apiUrl('test_audiences')
}
TestAudience.defaults = {
  sample_size: 0,
}

export default TestAudience
