import { ReferenceType } from 'datx'
import BaseRecord from './BaseRecord'
import QuestionAnswer from './QuestionAnswer'

class SurveyResponse extends BaseRecord {}

SurveyResponse.refDefaults = {
  question_answers: {
    model: QuestionAnswer,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

SurveyResponse.type = 'survey_responses'

export default SurveyResponse
