import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import { tagListsToCriteria } from '~/ui/test_collections/AudienceSettings/AudienceCriteria'

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
}
export default Audience
