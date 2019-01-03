import { ReferenceType } from 'datx'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'
import QuestionAnswer from './QuestionAnswer'

class SurveyResponse extends BaseRecord {
  static type = 'survey_responses'
  static endpoint = apiUrl('survey_responses')
}

SurveyResponse.refDefaults = {
  question_answers: {
    model: QuestionAnswer,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default SurveyResponse
