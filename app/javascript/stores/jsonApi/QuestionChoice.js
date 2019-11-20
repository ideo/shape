import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class QuestionChoice extends BaseRecord {
  static type = 'question_choices'
  static endpoint = apiUrl('question_choices')
}

export default QuestionChoice
