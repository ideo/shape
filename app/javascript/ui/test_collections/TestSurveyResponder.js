import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
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
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import ScrollingModule from '~/ui/test_collections/ScrollingModule'
import ClosedSurvey from '~/ui/test_collections/ClosedSurvey'
import googleTagManager from '~/vendor/googleTagManager'

const UNANSWERABLE_QUESTION_TYPES = [
  'question_media',
  'question_idea',
  'question_description',
  'question_finish',
  'question_recontact',
]

// note that card.id will have the idea_id appended by the serializer if present
const scrollIdentifier = card => `card-${card.id}`

@inject('apiStore')
@observer
class TestSurveyResponder extends React.Component {
  @observable
  questionCards = []
  @observable
  recontactAnswered = false
  @observable
  termsAnswered = false
  @observable
  welcomeAnswered = false
  @observable
  currentCardIdx = 0
  @observable
  surveyResponse = null

  async componentDidMount() {
    this.initializeCards()

    if (!this.currentUser) return
    await this.fetchSurveyResponse()
  }

  componentDidUpdate(prevProps) {
    const { collection } = this.props
    if (collection.id !== prevProps.collection.id) {
      this.fetchSurveyResponse()
    }
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
      (await apiStore.fetch('survey_responses', surveyResponseId, true))
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
        this.trackResponseEvent('responseStart')
      }
      return surveyResponse
    } catch (e) {
      trackError(e, { source: 'createSurveyResponse' })
      collection.test_status = 'closed'
    }
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
      questionCards.splice(questionFinishIndex + 1, 0, {
        id: 'recontact',
        card_question_type: 'question_recontact',
        order: recontactOrder,
        record: { id: 'recontact_item', content: '' },
      })
    }
    if (this.includeTerms) {
      questionCards.unshift({
        id: 'terms',
        card_question_type: 'question_terms',
        record: { id: 'terms', content: '' },
      })
    }
    // Always have the respondent welcome come first
    questionCards.unshift({
      id: 'welcome',
      card_question_type: 'question_welcome',
      record: { id: 'welcome', content: '' },
    })
    runInAction(() => {
      this.questionCards = questionCards
    })
  }

  questionAnswerForCard = card => {
    const { surveyResponse } = this
    if (card.card_question_type === 'question_welcome') {
      return this.welcomeAnswered
    }
    if (card.card_question_type === 'question_terms') {
      return this.termsAnswered
    }
    if (!surveyResponse) return undefined
    if (card.card_question_type === 'question_recontact') {
      return this.recontactAnswered
    }

    const findParams = {
      question_id: card.record.id,
    }
    if (card.idea_id) {
      findParams.idea_id = card.idea_id
    }
    return _.find(surveyResponse.question_answers, findParams)
  }

  answerableCard = card =>
    UNANSWERABLE_QUESTION_TYPES.indexOf(card.card_question_type) === -1

  get answerableCards() {
    return this.questionCards.filter(card => this.answerableCard(card))
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
      // turn off the card's actionmenu (dot-dot-dot)
      if (
        ['recontact', 'terms', 'welcome'].every(
          questionId => card.id !== questionId
        )
      )
        card.record.disableMenu()
      if (reachedLastVisibleCard) {
        return false
      } else if (
        !this.answerableCard(card) ||
        this.questionAnswerForCard(card)
      ) {
        // If not answerable, or they already answered, show it
        return true
      }
      reachedLastVisibleCard = true
      return true
    })
    return questions
  }

  afterQuestionAnswered = (card, answer) => {
    if (card.id === 'welcome') {
      runInAction(() => {
        this.welcomeAnswered = true
      })
    }
    if (card.id === 'recontact') {
      runInAction(() => {
        this.recontactAnswered = true
      })
      // this is the last question, don't try to scroll
      return
    }
    if (card.id === 'terms') {
      if (!answer) {
        // If they didn't agree to the terms, send to marketing page
        window.location.href = '/'
      }
      runInAction(() => {
        this.termsAnswered = true
      })
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
    if (this.hasFinishedSurvey(nextCard)) {
      this.trackResponseEvent('responseComplete')
      this.refreshUserAfterSurvey()
    }

    scroller.scrollTo(scrollIdentifier(nextCard), {
      duration: 400,
      smooth: true,
      // will default to document if none set (e.g. for standalone page)
      containerId,
      // when inside ActivityLog we want to account for the header at the top
      offset: containerId ? -75 : 0,
    })
  }

  trackResponseEvent(event) {
    const { collection } = this.props
    const { id, gives_incentive } = collection
    googleTagManager.push({
      event,
      timestamp: new Date().toUTCString(),
      testId: id,
      hasPaidAudience: gives_incentive,
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
      numAnswerableQuestionItems,
    } = this

    return (
      <ThemeProvider theme={styledTestTheme(this.theme)}>
        <div id="surveyContainer">
          <ProgressDots
            totalAmount={this.answerableCards.length + 1}
            currentProgress={this.currentCardIdx}
          />
          <ProgressSquare
            totalAmount={this.answerableCards.length + 1}
            currentProgress={this.currentCardIdx}
          />
          <GreetingMessage />
          {this.viewableCards.map(card => (
            <ScrollingModule
              key={scrollIdentifier(card)}
              name={scrollIdentifier(card)}
            >
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
                  canEdit={false}
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
