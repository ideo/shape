import _ from 'lodash'
import { Flex } from 'reflexbox'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import { Element as ScrollElement, scroller } from 'react-scroll'
import { ThemeProvider } from 'styled-components'

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

  afterQuestionAnswered = card => {
    this.scrollToTopOfNextCard(card)
  }

  scrollToTopOfNextCard = card => {
    const { collection, containerId } = this.props
    const index = collection.question_cards.indexOf(card)
    const nextCard = collection.question_cards[index + 1]
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
          {this.viewableCards().map(card => (
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
  surveyResponse: MobxPropTypes.objectOrObservableObject,
  theme: PropTypes.string,
  containerId: PropTypes.string,
}

TestSurveyResponder.defaultProps = {
  surveyResponse: undefined,
  theme: 'primary',
  containerId: '',
}

export default TestSurveyResponder
