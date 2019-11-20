import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Dataset extends SharedRecordMixin(BaseRecord) {
  static type = 'datasets'
  static endpoint = apiUrl('datasets')

  get identifier() {
    this.rawAttributes().identifier
  }

  // get dataWithDates() {
  //   return this.data.map(datum => {
  //     // Turn date strings into real dates
  //     if (datum.date) {
  //       datum.date = new Date(datum.date)
  //     }
  //     return datum
  //   })
  // }

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
