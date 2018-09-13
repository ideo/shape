import BaseRecord from './BaseRecord'

class QuestionAnswer extends BaseRecord {
  async API_save(method = 'POST') {
    try {
      const id = this.persisted ? `/${this.id}` : ''
      const res = await this.apiStore.request(
        `survey_responses/${this.survey_response.session_uid}/question_answers${id}`,
        method,
        { data: this.toJsonApi() }
      )
      return res.data
    } catch (e) {
      return false
    }
  }

  async API_create() {
    const answer = await this.API_save('POST')
    if (!answer || !answer.persisted) return false
    // make sure to attach this relationship
    answer.survey_response = this.survey_response
    this.survey_response.question_answers.push(answer)
    return answer
  }

  API_update(attrs) {
    this.update(attrs)
    return this.API_save('PATCH')
  }
}
QuestionAnswer.type = 'question_answers'

export default QuestionAnswer
