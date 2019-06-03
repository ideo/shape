import { computed } from 'mobx'

import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class Audience extends BaseRecord {
  static type = 'audiences'
  static endpoint = apiUrl('audiences')

  @computed
  get currentTestAudience() {
    // Find the test audience that's related to this audience and the test
    // collection the user is currently on
    const currentTestCollection = this.uiStore.viewingCollection
    const currentTestAudience = this.apiStore
      .findAll('test_audiences')
      .find(
        testAudience =>
          testAudience.test_collection_id.toString() ===
            currentTestCollection.id &&
          (testAudience => testAudience.audience_id.toString() === this.id)
      )
    return currentTestAudience
  }

  @computed
  get currentlySelected() {
    return !!this.currentTestAudience
  }

  @computed
  get currentSampleSize() {
    if (!this.currentTestAudience) return 0
    return this.currentTestAudience.sample_size
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
