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

  render() {
    const { surveyResponse } = this.state
    const { collection } = this.props
    const inner = collection.collection_cards.map((card, i) => {
      let questionAnswer
      const item = card.record
      // turn off the card's actionmenu (dot-dot-dot)
      card.record.menuDisabled = true
      if (surveyResponse) {
        questionAnswer = _.find(surveyResponse.question_answers, {
          question_id: item.id,
        })
      }
      return (
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
                  questionAnswer={questionAnswer}
                  parent={collection}
                  card={card}
                  item={item}
                  order={card.order}
                  editing={false}
                  canEdit={this.canEdit}
                />
              </TestQuestionHolder>
            </Flex>
          </div>
        </FlipMove>
      )
    })

    return <div>{inner}</div>
  }
}

TestSurveyResponder.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestSurveyResponder
