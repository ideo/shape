import { computed, observable } from 'mobx'

import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class Audience extends BaseRecord {
  static type = 'audiences'
  static endpoint = apiUrl('audiences')

  @observable
  currentlySelected = false

  @computed
  get currentSampleSize() {
    if (!this.testAudience) return 0
    return this.testAudience.sample_size
  }
}
export default Audience
