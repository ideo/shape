import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class Organization extends BaseRecord {
  static type = 'organizations'
  static endpoint = apiUrl('organizations')

  attributesForAPI = [
    'name',
    'domain_whitelist',
    'handle',
    'filestack_file_attributes',
  ]
}

Organization.type = 'organizations'

export default Organization
