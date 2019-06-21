import _ from 'lodash'
import { Flex } from 'reflexbox'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import { Element as ScrollElement, scroller } from 'react-scroll'
import { ThemeProvider } from 'styled-components'

import ProgressDots from '~/ui/global/ProgressDots'
import ProgressSquare from '~/ui/global/ProgressSquare'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import GreetingMessage from '~/ui/test_collections/GreetingMessage'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'

const UNANSWERABLE_QUESTION_TYPES = [
  'question_media',
  'question_description',
  'question_finish',
]

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
  @observable
  collection = null

  constructor(props) {
    super(props)
    console.log('TestSurveyResponder#constructor: ', props.collection)
    this.collection = props.collection
  }

  async componentDidMount() {
    this.initializeCards()

    const { apiStore } = this.props
    await apiStore.loadCurrentUser()
    if (!apiStore.currentUser) return
    await this.fetchSurveyResponse()
  }

  get includeRecontactQuestion() {
    return (
      // isn't this addressed in the ternary render in TestSurveyPage?
      !this.collection.live_test_collection &&
      (!this.currentUser ||
        this.currentUser.feedback_contact_preference ===
          'feedback_contact_unanswered')
    )
  }

  get includeTerms() {
    return !this.currentUser || !this.currentUser.respondent_terms_accepted
  }

  isSurveyInline() {
    // should this just be a boolean since it isn't being used elsewhere?
    return this.props.containerId === 'InlineTestContainer'
  }

  get collection() {
    const { collection } = this

    console.log('TestSurveyResponder# get collection: ', collection)

    return collection.live_test_collection
      ? collection.live_test_collection
      : collection
  }

  get testCollection() {
    if (!this.collection) return null
    return this.collection.live_test_collection
  }

  async fetchSurveyResponse() {
    const { apiStore } = this.props

    if (!this.testCollection) {
      return
    }
    const res = await this.fetchTestCollection()
    const testCollection = res.data
    // for submission tests, want to know if any other tests can be taken next
    if (testCollection.is_submission_test) {
      // don't need to `await` this, can happen async
      // this will also set nextAvailableTestPath on the testCollection
      testCollection.API_getNextAvailableTest()
    }

    const surveyResponseId = this.collection.survey_response_for_user_id
    const surveyResponseResult =
      surveyResponseId &&
      (await apiStore.fetch('survey_responses', surveyResponseId))
    const surveyResponse = surveyResponseResult
      ? surveyResponseResult.data
      : null
    this.surveyResponse = surveyResponse
  }

  createSurveyResponse = async () => {
    const { collection, apiStore } = this.props

    const newResponse = new SurveyResponse(
      {
        test_collection_id: this.collection.id,
      },
      apiStore
    )
    try {
      const surveyResponse = await newResponse.save()
      if (surveyResponse) {
        this.surveyResponse = surveyResponse
      }
      return surveyResponse
    } catch (e) {
      collection.test_status = 'closed'
    }
  }

  initializeCards() {
    const { collection } = this
    console.log('TestSurveyResponder#initializeCards: ', collection)

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
    return _.find(surveyResponse.question_answers, {
      question_id: card.record.id,
    })
  }

  answerableCard = card =>
    UNANSWERABLE_QUESTION_TYPES.indexOf(card.card_question_type) === -1

  get answerableCards() {
    return this.questionCards.filter(card => this.answerableCard(card))
  }

  get numAnswerableQuestionItems() {
    const { question_cards } = this.props.collection
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
    const { apiStore } = this.props
    const { currentUser } = apiStore

    return currentUser
  }

  refreshUserAfterSurvey() {
    const { apiStore } = this.props
    apiStore.loadCurrentUser()
  }

  render() {
    const { collection, theme } = this.props
    const {
      createSurveyResponse,
      surveyResponse,
      questionAnswerForCard,
      afterQuestionAnswered,
      canEdit,
      numAnswerableQuestionItems,
    } = this

    return (
      <ThemeProvider theme={styledTestTheme(theme)}>
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
            // ScrollElement only gets the right offsetTop if outside the FlipMove
            <ScrollElement name={`card-${card.id}`} key={card.id}>
              <FlipMove appearAnimation="fade">
                <div>
                  <Flex
                    style={{
                      width: 'auto',
                      flexWrap: 'wrap',
                    }}
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
                        canEdit={canEdit}
                        numberOfQuestions={numAnswerableQuestionItems}
                      />
                    </TestQuestionHolder>
                  </Flex>
                </div>
              </FlipMove>
            </ScrollElement>
          ))}
        </div>
      </ThemeProvider>
    )
  }
}

TestSurveyResponder.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  theme: PropTypes.string,
  containerId: PropTypes.string,
}

TestSurveyResponder.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TestSurveyResponder.defaultProps = {
  theme: 'primary',
  containerId: '',
}
TestSurveyResponder.displayName = 'TestSurveyResponder'

export default TestSurveyResponder
