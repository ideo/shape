import { computed } from 'mobx'

import { apiUrl } from '~/utils/url'
import { tagListsToCriteria } from '~/ui/test_collections/AudienceSettings/AudienceCriteria'
import BaseRecord from './BaseRecord'

class Audience extends BaseRecord {
  static type = 'audiences'
  static endpoint = apiUrl('audiences')

  @computed
  get tagLists() {
    const tagLists = {}
    for (const key in tagListsToCriteria) {
      tagLists[key] = this[key]
    }
    return tagLists
  }

  async API_create() {
    const { uiStore } = this
    try {
      await this.create()
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  get isLinkSharing() {
    return this.price_per_response === 0 && this.global_default === 1
  }
}
export default Audience
