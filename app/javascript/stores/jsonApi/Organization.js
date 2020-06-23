import { apiUrl } from '~/utils/url'
import { ReferenceType } from 'datx'
import { observable, runInAction } from 'mobx'
import _ from 'lodash'

import BaseRecord from './BaseRecord'
import Item from './Item'

class Organization extends BaseRecord {
  static type = 'organizations'
  static endpoint = apiUrl('organizations')

  @observable
  tags = []

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

  async API_getOrganizationUserTag(handle) {
    // FIXME: should return tag for handle
    return this.apiStore.request(
      `organizations/${this.id}/users?query=${handle}`,
      'GET'
    )
  }

  async API_getOrganizationTags() {
    return this.apiStore.request(`organizations/${this.id}/tags`, 'GET')
  }

  // NOTE: Initializes tag suggestions for react tags
  async initializeTags() {
    const organizationTags = await this.API_getOrganizationTags()
    const { data } = organizationTags

    const allTags = []
    if (data) {
      _.each(organizationTags.data, (tag, index) => {
        allTags.push({
          id: index,
          name: tag.name,
        })
      })
    }

    runInAction(() => {
      this.tags = allTags
    })
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
