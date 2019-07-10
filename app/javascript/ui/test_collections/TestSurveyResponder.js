import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, runInAction, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { scroller } from 'react-scroll'
import { ThemeProvider } from 'styled-components'

import trackError from '~/utils/trackError'
import ProgressDots from '~/ui/global/ProgressDots'
import ProgressSquare from '~/ui/global/ProgressSquare'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import GreetingMessage from '~/ui/test_collections/GreetingMessage'
import {
  allDemographicQuestions,
  cardQuestionTypeForQuestion,
  createDemographicsCardId,
} from '~/ui/test_collections/RespondentDemographics'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import ScrollingModule from '~/ui/test_collections/ScrollingModule'
import ClosedSurvey from '~/ui/test_collections/ClosedSurvey'

const UNANSWERABLE_QUESTION_TYPES = [
  'question_media',
  'question_description',
  'question_finish',
  'question_demographics_intro',
]

export const NON_TEST_QUESTION_TYPES = [
  'question_recontact',
  'question_terms',
  'question_welcome',
  'question_demographics_single_choice',
  'question_demographics_multiple_choice',
  'question_demographics_single_choice_menu',
]

const DEMOGRAPHIC_QUESTION_TYPES = [
  'question_demographics_intro',
  'question_demographics_single_choice',
  'question_demographics_multiple_choice',
  'question_demographics_single_choice_menu',
]

// Allow us to insert non-test questions into the survey while faking out some
// things that would otherwise cause us trouble.
const createFakeCollectionCard = ({
  id, // required
  cardQuestionType = `question_${id}`, // required
  order,
  recordId = id, // required
  recordContent = '',
}) => ({
  id,
  card_question_type: cardQuestionType,
  order,
  record: {
    id: recordId,
    content: recordContent,
    disableMenu: () => {}, // noop
  },
})

// Insert demographic questions into the survey. These need to mimic a
// CollectionCard closely enough to get passed to the TestQuestion component
// without issue, at which point the code diverges enough that we can apply
// special processing.
function createDemographicsQuestionCard(question) {
  const id = createDemographicsCardId(question)
  const cardQuestionType = cardQuestionTypeForQuestion(question)

  return {
    id,
    card_question_type: cardQuestionType,
    prompt: question.text,
    category: question.category,
    choices: question.choices,

    // a fake record to prevent errors.
    record: {
      id,
      content: question.text,
      disableMenu: () => {}, // noop
    },
  }
}

@inject('apiStore')
@observer
class TestSurveyResponder extends React.Component {
  @observable
  questionCards = []
  @observable
  currentCardIdx = 0
  @observable
  nonTestQuestionsAnswered = new Map()

  async componentDidMount() {
    this.initializeCards()

    if (!this.currentUser) return
    await this.fetchSurveyResponse()
  }

  get includeRecontactQuestion() {
    const { inline } = this.props
    if (inline) return false
    return (
      !this.currentUser ||
      this.currentUser.feedback_contact_preference ===
        'feedback_contact_unanswered'
    )
  }

  get includeTerms() {
    const { inline } = this.props
    // inline test does not show terms
    if (inline) return false
    return !this.currentUser || !this.currentUser.respondent_terms_accepted
  }

  async fetchSurveyResponse() {
    const { collection, apiStore } = this.props

    const surveyResponseId = collection.survey_response_for_user_id
    const surveyResponseResult =
      surveyResponseId &&
      (await apiStore.fetch('survey_responses', surveyResponseId))
    const surveyResponse = surveyResponseResult
      ? surveyResponseResult.data
      : null

    runInAction(() => {
      this.surveyResponse = surveyResponse
    })
  }

  createSurveyResponse = async () => {
    const { collection, apiStore } = this.props

    const newResponse = new SurveyResponse(
      {
        test_collection_id: collection.id,
      },
      apiStore
    )
    try {
      const surveyResponse = await newResponse.save()
      if (surveyResponse) {
        runInAction(() => {
          this.surveyResponse = surveyResponse
        })
      }
      return surveyResponse
    } catch (e) {
      trackError(e, { source: 'createSurveyResponse' })
      collection.test_status = 'closed'
    }
  }

  @action
  setNonTestQuestionAnswered(cardId, answered = true) {
    this.nonTestQuestionsAnswered.set(cardId, answered)
  }

  initializeCards() {
    const { collection } = this.props
    if (!collection || !collection.question_cards) return

    const questionCards = [...collection.question_cards]

    const questionFinishIndex = _.findIndex(
      questionCards,
      card => card.card_question_type === 'question_finish'
    )

    if (this.includeRecontactQuestion) {
      // Put recontact question after the finish question
      const recontactOrder = questionCards[questionFinishIndex].order + 1
      questionCards.splice(
        questionFinishIndex + 1,
        0,
        createFakeCollectionCard({
          id: 'recontact',
          order: recontactOrder,
          recordId: 'recontact_item',
        })
      )
    }

    const includeDemographicQuestions = true // TODO
    if (includeDemographicQuestions) {
      questionCards.push(createFakeCollectionCard({ id: 'demographics_intro' }))

      allDemographicQuestions().forEach(q => {
        questionCards.push(createDemographicsQuestionCard(q))
      })
    }

    if (this.includeTerms) {
      questionCards.unshift(
        createFakeCollectionCard({
          id: 'terms',
        })
      )
    }

    // Always have the respondent welcome come first
    questionCards.unshift(
      createFakeCollectionCard({
        id: 'welcome',
      })
    )

    runInAction(() => {
      this.questionCards = questionCards
    })
  }

  isNonTestQuestionCard = card =>
    _.includes(NON_TEST_QUESTION_TYPES, card.card_question_type)

  isDemograpicCard = card =>
    _.includes(DEMOGRAPHIC_QUESTION_TYPES, card.card_question_type)

  isAnswerableCard = card =>
    !_.includes(UNANSWERABLE_QUESTION_TYPES, card.card_question_type)

  questionAnswerForCard = card => {
    const { surveyResponse } = this
    if (!surveyResponse) return undefined

    return _.find(surveyResponse.question_answers, {
      question_id: card.record.id,
    })
  }

  answeredCard = card => {
    if (this.isNonTestQuestionCard(card)) {
      return this.nonTestQuestionsAnswered.get(card.id) === true
    }
    return !!this.questionAnswerForCard(card)
  }

  get answerableCards() {
    return this.questionCards.filter(card => this.isAnswerableCard(card))
  }

  get numAnswerableQuestionItems() {
    const { collection } = this.props
    const { question_cards } = collection
    return question_cards.filter(
      questionCard =>
        !_.includes(
          UNANSWERABLE_QUESTION_TYPES,
          questionCard.card_question_type
        )
    ).length
  }

  get viewableCards() {
    const { questionCards } = this

    let reachedLastVisibleCard = false
    const questions = questionCards.filter(card => {
      if (reachedLastVisibleCard) {
        return false
      } else if (!this.isAnswerableCard(card) || this.answeredCard(card)) {
        // If not answerable, or they already answered, show it
        return true
      }
      reachedLastVisibleCard = true
      return true
    })

    // turn off the card's actionmenu (dot-dot-dot)
    questions.forEach(card => card.record.disableMenu())
    return questions
  }

  afterQuestionAnswered = (card, answer) => {
    if (this.isNonTestQuestionCard(card)) {
      this.setNonTestQuestionAnswered(card.id)
    }
    if (card.card_question_type === 'question_recontact') {
      // this is the last question, don't try to scroll
      //
      // n.b. this hack hides a scrolling bug that triggers, because the props
      // change when a user asks to be recontacted
      return
    }
    if (card.card_question_type === 'question_terms') {
      if (!answer) {
        // If they didn't agree to the terms, send to marketing page
        window.location.href = '/'
      }
    }
    setTimeout(() => {
      this.scrollToTopOfNextCard(card)
    }, 100)
  }

  scrollToTopOfNextCard = card => {
    const { questionCards } = this
    const { containerId } = this.props
    const index = questionCards.indexOf(card)
    const answerableIdx = this.answerableCards.indexOf(card)
    runInAction(() => {
      this.currentCardIdx = answerableIdx + 1
    })
    const nextCard = questionCards[index + 1]
    if (!nextCard) return
    if (this.hasFinishedSurvey(nextCard)) this.refreshUserAfterSurvey()

    scroller.scrollTo(`card-${nextCard.id}`, {
      duration: 400,
      smooth: true,
      // will default to document if none set (e.g. for standalone page)
      containerId,
      // when inside ActivityLog we want to account for the header at the top
      offset: containerId ? -75 : 0,
    })
  }

  hasFinishedSurvey(nextCard) {
    return nextCard.card_question_type === 'question_finish'
  }

  get currentUser() {
    return this.props.apiStore.currentUser
  }

  refreshUserAfterSurvey() {
    const { apiStore } = this.props
    apiStore.loadCurrentUser()
  }

  get theme() {
    const { inline } = this.props
    return inline ? 'secondary' : 'primary'
  }

  render() {
    const { collection } = this.props
    const { surveyResponse } = this
    if (collection.test_status !== 'live') {
      return (
        <ClosedSurvey
          collection={collection}
          sessionUid={surveyResponse && surveyResponse.sessionUid}
        />
      )
    }

    const {
      createSurveyResponse,
      questionAnswerForCard,
      afterQuestionAnswered,
      canEdit,
      numAnswerableQuestionItems,
    } = this

    const surveyQuestions = this.questionCards.filter(
      card => this.isAnswerableCard(card) && !this.isDemograpicCard(card)
    )
    const surveyDuration = surveyQuestions.length
    const surveyProgress = Math.min(this.currentCardIdx, surveyDuration - 1) // this assumes demographic cards are after the survey

    return (
      <ThemeProvider theme={styledTestTheme(this.theme)}>
        <div id="surveyContainer">
          <ProgressDots
            totalAmount={surveyDuration}
            currentProgress={surveyProgress}
          />
          <ProgressSquare
            totalAmount={surveyDuration}
            currentProgress={surveyProgress}
          />
          <GreetingMessage />
          {this.viewableCards.map(card => (
            <ScrollingModule key={card.id} name={`card-${card.id}`}>
              <TestQuestionHolder editing={false} userEditable={false}>
                <TestQuestion
                  createSurveyResponse={createSurveyResponse}
                  surveyResponse={surveyResponse}
                  questionAnswer={questionAnswerForCard(card)}
                  afterQuestionAnswered={afterQuestionAnswered}
                  parent={collection}
                  card={card}
                  item={card.record}
                  order={card.order}
                  editing={false}
                  canEdit={canEdit}
                  numberOfQuestions={numAnswerableQuestionItems}
                />
              </TestQuestionHolder>
            </ScrollingModule>
          ))}
        </div>
      </ThemeProvider>
    )
  }
}

TestSurveyResponder.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  containerId: PropTypes.string,
  inline: PropTypes.bool,
}

TestSurveyResponder.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TestSurveyResponder.defaultProps = {
  containerId: '',
  inline: false,
}
TestSurveyResponder.displayName = 'TestSurveyResponder'

export default TestSurveyResponder
