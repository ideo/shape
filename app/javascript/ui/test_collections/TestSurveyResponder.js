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

  initializeCards() {
    const { collection, includeRecontactQuestion, includeTerms } = this.props

    const questionCards = [...collection.question_cards]

    const questionFinishIndex = _.findIndex(
      questionCards,
      card => card.card_question_type === 'question_finish'
    )

    if (includeRecontactQuestion) {
      // Put recontact question after the finish question
      const recontactOrder = questionCards[questionFinishIndex].order + 1
      questionCards.splice(questionFinishIndex + 1, 0, {
        id: 'recontact',
        card_question_type: 'question_recontact',
        order: recontactOrder,
        record: { id: 'recontact_item', content: '' },
      })
    }
    if (includeTerms) {
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
    const { surveyResponse } = this.props
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
    scroller.scrollTo(`card-${nextCard.id}`, {
      duration: 400,
      smooth: true,
      // will default to document if none set (e.g. for standalone page)
      containerId,
      // when inside ActivityLog we want to account for the header at the top
      offset: containerId ? -75 : 0,
    })
  }

  render() {
    const {
      collection,
      surveyResponse,
      createSurveyResponse,
      theme,
    } = this.props
    return (
      <ThemeProvider theme={styledTestTheme(theme)}>
        <div id="surveyContainer">
          <ProgressDots
            totalAmount={this.numAnswerableQuestionItems}
            currentProgress={this.currentCardIdx}
          />
          <ProgressSquare
            totalAmount={this.numAnswerableQuestionItems}
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
