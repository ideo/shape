import _ from 'lodash'

import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Dataset extends SharedRecordMixin(BaseRecord) {
  static type = 'datasets'
  static endpoint = apiUrl('datasets')

  attributesForAPI = [
    'type',
    'name',
    'identifier',
    'description',
    'max_domain',
    'measure',
    'timeframe',
    'identifier',
    'chart_type',
    'data_source_type',
    'data_source_id',
    'groupings',
  ]

  get identifier() {
    this.rawAttributes().identifier
  }

  get dataWithDates() {
    if (!this.data) return []
    const today = new Date()

    return this.data.map(datum => {
      const d = { ...datum }
      // Turn date strings into real dates
      if (d.date) {
        d.date = new Date(d.date)
        // Constrain any future date to today (Creative Difference sends dates
        // based on a whole quarter)
        if (d.date > today) {
          d.date = today
        }
      }
      return d
    })
  }

  get hasDates() {
    return _.some(this.dataWithDates, datum => datum.date)
  }

  get isEmojiOrScaleQuestion() {
    return [
      'question_clarity',
      'question_excitement',
      'question_different',
      'question_useful',
      'question_category_satisfaction',
      'question_context',
    ].includes(this.question_type)
  }
}

export default Dataset
