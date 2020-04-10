import PropTypes from 'prop-types'
import { kebabCase } from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CustomizableQuestion from '~/ui/test_collections/CustomizableQuestion'
import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'
import FinishQuestion from '~/ui/test_collections/FinishQuestion'
import RecontactQuestion from '~/ui/test_collections/RecontactQuestion'
import NextTestQuestion from '~/ui/test_collections/NextTestQuestion'
import NewQuestionGraphic from '~/ui/icons/NewQuestionGraphic'
import OpenQuestion from '~/ui/test_collections/OpenQuestion'
import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import TermsQuestion from '~/ui/test_collections/TermsQuestion'
import WelcomeQuestion from '~/ui/test_collections/WelcomeQuestion'
import IdeaQuestion from '~/ui/test_collections/IdeaQuestion'
import MediaQuestion from '~/ui/test_collections/MediaQuestion'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import QuestionAnswer from '~/stores/jsonApi/QuestionAnswer'

const QuestionHolder = styled.div`
  ${props => props.empty && 'margin-bottom: -6px;'};
`

const NON_TEST_QUESTIONS = [
  'question_recontact',
  'question_terms',
  'question_welcome',
]

@inject('apiStore')
@observer
class TestQuestion extends React.Component {
  handleQuestionAnswer = async answer => {
    const {
      card,
      editing,
      createSurveyResponse,
      afterQuestionAnswered,
      apiStore,
    } = this.props
    const { record } = card
    const { text, number, selected_choice_ids, skipScrolling } = answer
    let { surveyResponse, questionAnswer } = this.props
    // components should never trigger this when editing, but double-check here
    if (editing) return
    if (NON_TEST_QUESTIONS.includes(card.card_question_type)) {
      afterQuestionAnswered(card, answer)
      return
    }

    if (!questionAnswer) {
      if (!surveyResponse) {
        surveyResponse = await createSurveyResponse()
      }
      // if creation fails due to test being closed, exit early
      if (!surveyResponse) return
      // create new answer if we didn't have one
      questionAnswer = new QuestionAnswer(
        {
          question_id: record.id,
          idea_id: card.idea_id,
          answer_text: text,
          answer_number: number,
          selected_choice_ids,
        },
        apiStore
      )
      questionAnswer.survey_response = surveyResponse
      await questionAnswer.API_create()
    } else {
      // needs to be attached in order to provide the session_uid
      if (surveyResponse) questionAnswer.survey_response = surveyResponse
      // update values on existing answer and save
      await questionAnswer.API_update({
        answer_text: text,
        answer_number: number,
        selected_choice_ids,
      })
    }

    if (skipScrolling) {
      return
    }
    afterQuestionAnswered(card)
  }

  handleInstanceQuestionContentUpdate = () => {
    const { card, parent } = this.props
    if (parent && parent.isTemplate) {
      const {
        record: { type },
        id,
      } = card
      if (type && id) {
        const ids = [id]
        parent.API_backgroundUpdateTemplateInstances({ type, ids })
      }
    }
    if (parent && parent.isLiveTest) {
      // e.g. if you add an OpenQuestion to a live test, we wait until you've entered the content
      parent.API_backgroundUpdateLiveTest(card.id)
    }
  }

  get givesIncentive() {
    return this.props.parent.gives_incentive
  }

  get potentialIncentive() {
    const { surveyResponse } = this.props
    if (!this.givesIncentive || !surveyResponse) return 0
    return surveyResponse.potential_incentive
  }

  renderQuestion() {
    const {
      parent,
      card,
      editing,
      questionAnswer,
      canEdit,
      surveyResponse,
      numberOfQuestions,
      testStatus,
      apiStore,
      handleFocus,
    } = this.props
    const { record } = card

    switch (card.card_question_type) {
      case 'question_useful':
      case 'question_clarity':
      case 'question_excitement':
      case 'question_context':
      case 'question_different':
      case 'question_category_satisfaction':
        return (
          <ScaleQuestion
            question={record}
            editing={editing}
            questionAnswer={questionAnswer}
            onAnswer={this.handleQuestionAnswer}
            handleInstanceQuestionContentUpdate={
              this.handleInstanceQuestionContentUpdate
            }
          />
        )
      case 'question_single_choice':
      case 'question_multiple_choice':
        return (
          <CustomizableQuestion
            question={record}
            editing={editing}
            questionAnswer={questionAnswer}
            onAnswer={this.handleQuestionAnswer}
            handleFocus={handleFocus}
            handleInstanceQuestionContentUpdate={
              this.handleInstanceQuestionContentUpdate
            }
            question_choices={record.question_choices}
            isTestDraft={testStatus === 'draft'}
          />
        )
      case 'media':
      case 'question_media':
        return <MediaQuestion card={card} parent={parent} canEdit={canEdit} />
      case 'question_idea':
        return (
          <IdeaQuestion
            card={card}
            parent={parent}
            canEdit={canEdit}
            handleFocus={handleFocus}
            handleInstanceQuestionContentUpdate={
              this.handleInstanceQuestionContentUpdate
            }
          />
        )
      case 'question_description':
        return (
          <QuestionContentEditor
            placeholder="add text here…"
            item={record}
            canEdit={canEdit}
            handleFocus={handleFocus}
            handleInstanceQuestionContentUpdate={
              this.handleInstanceQuestionContentUpdate
            }
          />
        )
      case 'question_open':
        return (
          <OpenQuestion
            item={record}
            editing={editing}
            canEdit={canEdit}
            questionAnswer={questionAnswer}
            onAnswer={this.handleQuestionAnswer}
            handleFocus={handleFocus}
            handleInstanceQuestionContentUpdate={
              this.handleInstanceQuestionContentUpdate
            }
          />
        )
      case 'question_finish':
        if (parent.nextAvailableTestPath) {
          return <NextTestQuestion path={parent.nextAvailableTestPath} />
        }
        return (
          <FinishQuestion
            incentiveAmount={this.potentialIncentive}
            submissionBox={
              parent.is_submission_box_template_test ||
              parent.is_submission_test
            }
          />
        )
      case 'question_recontact':
        return (
          <RecontactQuestion
            user={apiStore.currentUser}
            onAnswer={this.handleQuestionAnswer}
            sessionUid={surveyResponse.session_uid}
            givesIncentive={this.givesIncentive}
          />
        )
      case 'question_terms':
        return (
          <TermsQuestion
            user={apiStore.currentUser}
            onAnswer={this.handleQuestionAnswer}
          />
        )
      case 'question_welcome':
        return (
          <WelcomeQuestion
            potentialIncentive={this.potentialIncentive}
            numberOfQuestions={numberOfQuestions}
            onAnswer={this.handleQuestionAnswer}
          />
        )

      default:
        return <NewQuestionGraphic />
    }
  }

  get questionIdentifier() {
    const { card } = this.props
    const { record } = card
    if (record.question_description || record.content) {
      return 'question-' + (record.question_description || record.content)
    }
    return card.card_question_type
  }

  render() {
    const { card } = this.props
    return (
      <QuestionHolder
        empty={!card.card_question_type}
        data-cy={kebabCase(this.questionIdentifier)}
      >
        {this.renderQuestion()}
      </QuestionHolder>
    )
  }
}

TestQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool.isRequired,
  surveyResponse: MobxPropTypes.objectOrObservableObject,
  questionAnswer: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  createSurveyResponse: PropTypes.func,
  afterQuestionAnswered: PropTypes.func,
  canEdit: PropTypes.bool,
  handleFocus: PropTypes.func,
  numberOfQuestions: PropTypes.number,
  question_choices: MobxPropTypes.arrayOrObservableArray,
  testStatus: PropTypes.oneOf(['draft', 'live', 'closed']),
}
TestQuestion.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TestQuestion.defaultProps = {
  surveyResponse: null,
  questionAnswer: null,
  createSurveyResponse: null,
  afterQuestionAnswered: null,
  canEdit: false,
  numberOfQuestions: null,
  question_choices: [],
  handleFocus: () => true,
  testStatus: 'draft',
}

TestQuestion.displayName = 'TestQuestion'

export default TestQuestion
