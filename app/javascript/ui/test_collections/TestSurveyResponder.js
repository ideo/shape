import _ from 'lodash'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'

import { apiStore } from '~/stores/'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import { TestQuestionHolder } from '~/ui/test_collections/shared'
import TestQuestion from '~/ui/test_collections/TestQuestion'

@observer
class TestSurveyResponder extends React.Component {
  state = {
    surveyResponse: null,
  }

  createSurveyResponse = async () => {
    const { collection } = this.props
    const newResponse = new SurveyResponse(
      {
        test_collection_id: collection.id,
      },
      apiStore
    )
    const surveyResponse = await newResponse.save()
    if (surveyResponse) {
      this.setState({ surveyResponse })
    }
    return surveyResponse
  }

  questionAnswerForCard = card => {
    const { surveyResponse } = this.state
    if (!surveyResponse) return
    return _.find(surveyResponse.question_answers, {
      question_id: card.record.id,
    })
  }

  answerableCard = card =>
    ['question_useful', 'question_open', 'question_context'].indexOf(
      card.card_question_type
    ) !== -1

  viewableCards = () => {
    const { collection } = this.props
    let reachedLastVisibleCard = false
    return collection.collection_cards.filter(card => {
      // turn off the card's actionmenu (dot-dot-dot)
      card.record.menuDisabled = true
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

  render() {
    const { surveyResponse } = this.state
    const { collection } = this.props
    return (
      <div>
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
                  <TestQuestion
                    createSurveyResponse={this.createSurveyResponse}
                    surveyResponse={surveyResponse}
                    questionAnswer={this.questionAnswerForCard(card)}
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
        ))}
      </div>
    )
  }
}

TestSurveyResponder.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestSurveyResponder
