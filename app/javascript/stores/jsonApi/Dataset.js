import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Dataset extends SharedRecordMixin(BaseRecord) {
  static type = 'datasets'
  static endpoint = apiUrl('datasets')

  get identifier() {
    this.rawAttributes().identifier
  }

  get dataWithDates() {
    if (!this.data) return []

    return this.data.map(datum => {
      const d = { ...datum }
      // Turn date strings into real dates
      if (d.date) {
        d.date = new Date(d.date)
      }
      return d
    })
  }

  get hasDates() {
    return !!this.dataWithDates[0].date
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
