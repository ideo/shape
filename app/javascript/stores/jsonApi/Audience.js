import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class Audience extends BaseRecord {
  static type = 'audiences'
  static endpoint = apiUrl('audiences')

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
