import _ from 'lodash'
import { Flex } from 'reflexbox'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import { Element as ScrollElement, scroller } from 'react-scroll'
import { ThemeProvider } from 'styled-components'

// NOTE: Always import these models after everything else, can lead to odd dependency!
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import TestQuestion from '~/ui/test_collections/TestQuestion'

const UNANSWERABLE_QUESTION_TYPES = [
  'question_media',
  'question_description',
  'question_finish',
]

@observer
class TestSurveyResponder extends React.Component {
  constructor(props) {
    super(props)
    this.containerId = 'surveyResponse'
  }

  questionAnswerForCard = card => {
    const { surveyResponse } = this.props
    if (!surveyResponse) return undefined
    return _.find(surveyResponse.question_answers, {
      question_id: card.record.id,
    })
  }

  answerableCard = card =>
    UNANSWERABLE_QUESTION_TYPES.indexOf(card.card_question_type) === -1

  viewableCards = () => {
    const { collection } = this.props
    let reachedLastVisibleCard = false
    return collection.question_cards.filter(card => {
      // turn off the card's actionmenu (dot-dot-dot)
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
  }

  handleQuestionAnswerCreatedForCard = card => {
    this.scrollToTopOfNextCard(card)
  }

  contentHeight = () => this.containerDiv.clientHeight

  containerDiv = () => document.getElementById(this.containerId)

  scrollToTopOfNextCard = card => {
    const { collection } = this.props
    const index = collection.question_cards.indexOf(card)
    const nextCard = collection.question_cards[index + 1]
    if (!nextCard) return
    scroller.scrollTo(`card-${nextCard.id}`, {
      duration: 350,
      container: this.containerId,
      offset: -1 * this.contentHeight(),
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
        <div id={this.containerId}>
          {this.viewableCards().map(card => (
            <FlipMove appearAnimation="fade" key={card.id}>
              <div>
                <Flex
                  style={{
                    width: 'auto',
                    flexWrap: 'wrap',
                  }}
                >
                  <TestQuestionHolder editing={false} userEditable={false}>
                    <ScrollElement name={`card-${card.id}`}>
                      <TestQuestion
                        createSurveyResponse={createSurveyResponse}
                        surveyResponse={surveyResponse}
                        questionAnswer={this.questionAnswerForCard(card)}
                        handleQuestionAnswerCreatedForCard={
                          this.handleQuestionAnswerCreatedForCard
                        }
                        parent={collection}
                        card={card}
                        item={card.record}
                        order={card.order}
                        editing={false}
                        canEdit={this.canEdit}
                      />
                    </ScrollElement>
                  </TestQuestionHolder>
                </Flex>
              </div>
            </FlipMove>
          ))}
        </div>
      </ThemeProvider>
    )
  }
}

TestSurveyResponder.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  createSurveyResponse: PropTypes.func.isRequired,
  surveyResponse: MobxPropTypes.objectOrObservableObject,
  theme: PropTypes.string,
}

TestSurveyResponder.defaultProps = {
  surveyResponse: undefined,
  theme: 'primary',
}

export default TestSurveyResponder
