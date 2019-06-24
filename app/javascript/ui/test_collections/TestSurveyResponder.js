import { find, findIndex, includes } from 'lodash'
import { Flex } from 'reflexbox'
import PropTypes from 'prop-types'
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
import {
  allDemographicQuestions,
  cardQuestionTypeForQuestion,
  createDemographicsCardId,
} from '~/ui/test_collections/RespondentDemographics'

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
  'question_demographic_single_choice',
]

const DEMOGRAPHIC_QUESTION_TYPES = [
  'question_demographics_intro',
  'question_demographic_single_choice',
]

// Allow us to insert non-test questions into the survey while faking out some
// things that would otherwise cause us trouble.
const createFakeCollectionCard = ({
  id, // *
  cardQuestionType = `question_${id}`, // *
  order,
  recordId = id, // *
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
  state = {
    questionCards: [],
    currentCardIdx: 0,
    nonTestQuestionsAnswered: {}, // [card.id] => boolean
  }

  componentDidMount() {
    this.initializeCards()
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.includeTerms != prevProps.includeTerms ||
      this.props.includeRecontactQuestion != prevProps.includeRecontactQuestion
    ) {
      this.initializeCards()
    }
  }

  get questionCards() {
    return this.state.questionCards
  }

  get currentCardIdx() {
    return this.state.currentCardIdx
  }

  get nonTestQuestionsAnswered() {
    return this.state.nonTestQuestionsAnswered
  }

  set questionCards(collection) {
    this.setState({
      questionCards: collection,
    })
  }

  set currentCardIdx(value) {
    this.setState({
      currentCardIdx: value,
    })
  }

  setNonTestQuestionAnswered(cardId, answered = true) {
    this.setState({
      nonTestQuestionsAnswered: {
        ...this.nonTestQuestionsAnswered,
        [cardId]: answered,
      },
    })
  }

  initializeCards() {
    const { collection, includeRecontactQuestion, includeTerms } = this.props
    if (!collection.question_cards) return
    const questionCards = [...collection.question_cards]

    const questionFinishIndex = findIndex(
      questionCards,
      card => card.card_question_type === 'question_finish'
    )

    if (includeRecontactQuestion) {
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

    if (includeTerms) {
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

    this.questionCards = questionCards
  }

  isNonTestQuestionCard = card =>
    NON_TEST_QUESTION_TYPES.includes(card.card_question_type)

  isDemograpicCard = card =>
    DEMOGRAPHIC_QUESTION_TYPES.includes(card.card_question_type)

  isAnswerableCard = card =>
    UNANSWERABLE_QUESTION_TYPES.indexOf(card.card_question_type) === -1

  questionAnswerForCard = card => {
    const { surveyResponse } = this.props
    if (!surveyResponse) return undefined

    return find(surveyResponse.question_answers, {
      question_id: card.record.id,
    })
  }

  answeredCard = card => {
    if (this.isNonTestQuestionCard(card)) {
      return this.nonTestQuestionsAnswered[card.id] === true
    }

    return !!this.questionAnswerForCard(card)
  }

  get answerableCards() {
    return this.questionCards.filter(card => this.isAnswerableCard(card))
  }

  get numAnswerableQuestionItems() {
    const { question_cards } = this.props.collection
    return question_cards.filter(
      questionCard =>
        !includes(UNANSWERABLE_QUESTION_TYPES, questionCard.card_question_type)
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
    this.currentCardIdx = answerableIdx + 1
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

  refreshUserAfterSurvey() {
    const { apiStore } = this.props
    apiStore.loadCurrentUser()
  }

  render() {
    const {
      collection,
      surveyResponse,
      createSurveyResponse,
      theme,
    } = this.props

    const surveyQuestions = this.questionCards.filter(
      card => this.isAnswerableCard(card) && !this.isDemograpicCard(card)
    )
    const surveyDuration = surveyQuestions.length
    const surveyProgress = Math.min(this.currentCardIdx, surveyDuration - 1) // this assumes demographic cards are after the survey

    return (
      <ThemeProvider theme={styledTestTheme(theme)}>
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
                        questionAnswer={this.questionAnswerForCard(card)}
                        afterQuestionAnswered={this.afterQuestionAnswered}
                        parent={collection}
                        card={card}
                        item={card.record}
                        order={card.order}
                        editing={false}
                        canEdit={this.canEdit}
                        numberOfQuestions={this.numAnswerableQuestionItems}
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
  createSurveyResponse: PropTypes.func.isRequired,
  user: MobxPropTypes.objectOrObservableObject,
  surveyResponse: MobxPropTypes.objectOrObservableObject,
  includeRecontactQuestion: PropTypes.bool,
  includeTerms: PropTypes.bool,
  theme: PropTypes.string,
  containerId: PropTypes.string,
}

TestSurveyResponder.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TestSurveyResponder.defaultProps = {
  user: null,
  surveyResponse: undefined,
  theme: 'primary',
  containerId: '',
  includeRecontactQuestion: false,
  includeTerms: false,
}
TestSurveyResponder.displayName = 'TestSurveyResponder'

export default TestSurveyResponder
