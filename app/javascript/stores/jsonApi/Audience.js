import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class Audience extends BaseRecord {
  static type = 'audiences'
  static endpoint = apiUrl('audiences')
}

export default Audience
