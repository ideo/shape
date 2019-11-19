import { computed } from 'mobx'

import { apiUrl } from '~/utils/url'
import { AUDIENCE_PRICES } from '~/utils/variables'
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

  pricePerResponse = numPaidQuestions => {
    if (this.isLinkSharing) return 0

    let numQuestions = numPaidQuestions - AUDIENCE_PRICES.MIN_NUM_PAID_QUESTIONS
    if (numQuestions < AUDIENCE_PRICES.MIN_NUM_PAID_QUESTIONS)
      numQuestions = AUDIENCE_PRICES.MIN_NUM_PAID_QUESTIONS

    return (
      this.min_price_per_response +
      numQuestions * AUDIENCE_PRICES.TEST_PRICE_PER_QUESTION
    )
  }

  get isLinkSharing() {
    return this.min_price_per_response === 0 && this.global_default === 1
  }
}
export default Audience
