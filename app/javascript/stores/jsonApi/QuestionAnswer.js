import _ from 'lodash'
import { runInAction } from 'mobx'

import { apiUrl } from '~/utils/url'
import { objectsEqual } from '~/utils/objectUtils'
import BaseRecord from './BaseRecord'

class QuestionAnswer extends BaseRecord {
  static type = 'question_answers'
  static endpoint = apiUrl('question_answers')

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
      if (
        e.error &&
        _.includes(_.map(e.error, 'detail'), 'no longer accepting answers')
      ) {
        const test_collection = this.apiStore.find(
          'collections',
          this.survey_response.test_collection_id
        )
        test_collection.test_status = 'closed'
      }
      // else probably just a uniqueness constraint from double-clicking, ok to ignore and move on
      return false
    }
  }

  async API_create() {
    const answer = await this.API_save('POST')
    if (!answer || !answer.persisted) return false
    // make sure to attach this relationship
    answer.survey_response = this.survey_response
    runInAction(() => {
      this.survey_response.question_answers.push(answer)
    })
    return answer
  }

  API_update(attrs) {
    const previous = this.answerAttributes()
    // update the local model
    this.update(attrs)
    const updated = this.answerAttributes()
    // no need to API save if there was no change
    if (objectsEqual(previous, updated)) return
    return this.API_save('PATCH')
  }

  answerAttributes() {
    // only pick key/values that are present
    return _.pickBy(this.toJsonApi().attributes)
  }
}

export default QuestionAnswer
