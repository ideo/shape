import { apiUrl } from '~/utils/url'
import { ReferenceType } from 'datx'

import BaseRecord from './BaseRecord'
import Item from './Item'

class Organization extends BaseRecord {
  static type = 'organizations'
  static endpoint = apiUrl('organizations')

  API_createTermsTextItem() {
    return this.apiStore.request(
      `/organizations/${this.id}/add_terms_text`,
      'PATCH'
    )
  }

  attributesForAPI = [
    'in_app_billing',
    'name',
    'domain_whitelist',
    'handle',
    'filestack_file_attributes',
    'deactivated',
    'terms_text_item_id',
  ]
}

Organization.type = 'organizations'

Organization.refDefaults = {
  terms_text_item: {
    model: Item,
    type: ReferenceType.TO_ONE,
    defaultValue: {},
  },
}

export default Organization
