import { apiUrl } from '~/utils/url'
import { ReferenceType } from 'datx'

import BaseRecord from './BaseRecord'
import Item from './Item'

class Organization extends BaseRecord {
  static type = 'organizations'
  static endpoint = apiUrl('organizations')

  API_createTermsTextItem() {
    return this.apiStore.request(
      `organizations/${this.id}/add_terms_text`,
      'PATCH'
    )
  }

  API_removeTermsTextItem() {
    return this.apiStore.request(
      `organizations/${this.id}/remove_terms_text`,
      'PATCH'
    )
  }

  API_bumpTermsVersion() {
    return this.apiStore.request(
      `organizations/${this.id}/bump_terms_version`,
      'PATCH'
    )
  }

  async API_getOrganizationTagList() {
    const { currentUserOrganizationId } = this.apiStore
    const apiPath = `organizations/${currentUserOrganizationId}/tags`
    const result = await this.apiStore.requestJson(apiPath)
    // FIXME: also fetch user tags for the org
    if (!result.data) return []
    return result.data.map(tag => ({
      id: tag.attributes.id,
      name: tag.attributes.name,
      type: tag.attributes.tag_type,
    }))
  }

  async API_getOrganizationUserTagList() {
    // FIXME: unimplemented
    return await Promise.resolve([])
  }

  attributesForAPI = [
    'in_app_billing',
    'name',
    'handle',
    'domain_whitelist',
    'filestack_file_attributes',
    'deactivated',
  ]
}

Organization.type = 'organizations'

Organization.refDefaults = {
  terms_text_item: {
    model: Item,
    type: ReferenceType.TO_ONE,
    defaultValue: null,
  },
}

export default Organization
