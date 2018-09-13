import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCard from '~/ui/grid/GridCard'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import DescriptionQuestion from '~/ui/test_collections/DescriptionQuestion'
import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import OpenQuestion from '~/ui/test_collections/OpenQuestion'
import v from '~/utils/variables'
import { apiStore, uiStore } from '~/stores'
import QuestionAnswer from '~/stores/jsonApi/QuestionAnswer'
import { QuestionText } from './shared'

const QuestionHolder = styled.div`
  display: flex;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    flex-direction: column;
    margin-bottom: 10px;
  }
`

const QuestionCardWrapper = styled.div`
  width: 334px;
  height: 250px;
`

@observer
class TestQuestionEditor extends React.Component {
  handleQuestionAnswer = async ({ text, number }) => {
    const { item, editing, createSurveyResponse } = this.props
    let { surveyResponse, questionAnswer } = this.props
    // components should never trigger this when editing, but double-check here
    if (editing) return

    if (!questionAnswer) {
      if (!surveyResponse) {
        surveyResponse = await createSurveyResponse()
      }
      // create new answer if we didn't have one
      questionAnswer = new QuestionAnswer({
        question_id: item.id,
        answer_text: text,
        answer_number: number,
      }, apiStore)
      questionAnswer.survey_response = surveyResponse
      await questionAnswer.API_create()
    } else {
      // update values on existing answer and save
      await questionAnswer.API_update({
        answer_text: text,
        answer_number: number,
      })
    }
  }

  renderQuestion() {
    const { parent, card, item, editing, questionAnswer } = this.props
    let inner
    switch (card.card_question_type) {
    case 'context':
      return (
        <ScaleQuestion
          questionText="How satisfied are you with your current solution?"
          editing={editing}
          questionAnswer={questionAnswer}
          onAnswer={this.handleQuestionAnswer}
        />
      )
    case 'useful':
      return (
        <ScaleQuestion
          questionText="How useful is this idea for you?"
          emojiSeries="thumbs"
          editing={editing}
          questionAnswer={questionAnswer}
          onAnswer={this.handleQuestionAnswer}
        />
      )
    case 'media':
      if (
        item.type === 'Item::QuestionItem' ||
        uiStore.blankContentToolState.replacingId === card.id
      ) {
        // this case means it is set to "blank / add your media"
        inner = (
          <GridCardBlank
            parent={parent}
            height={1}
            order={card.order}
            replacingId={card.id}
            testCollectionCard
          />
        )
      } else {
        inner = (
          <GridCard
            card={card}
            cardType="items"
            record={card.record}
            menuOpen={uiStore.openCardMenuId === card.id}
            testCollectionCard
          />
        )
      }
      return (
        <QuestionCardWrapper>
          {inner}
        </QuestionCardWrapper>
      )
    case 'description':
      if (editing) {
        return (
          <DescriptionQuestion
            item={item}
          />
        )
      }
      return <QuestionText>{item.content}</QuestionText>

    case 'open':
      return (
        <OpenQuestion
          item={item}
          editing={editing}
          questionAnswer={questionAnswer}
          onAnswer={this.handleQuestionAnswer}
        />
      )
    default:
      return ''
    }
  }

  render() {
    return (
      <QuestionHolder>
        {this.renderQuestion()}
      </QuestionHolder>
    )
  }
}

TestQuestionEditor.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool.isRequired,
  surveyResponse: MobxPropTypes.objectOrObservableObject,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  createSurveyResponse: PropTypes.func,
}

TestQuestionEditor.defaultProps = {
  surveyResponse: null,
  questionAnswer: null,
  createSurveyResponse: null,
}

export default TestQuestionEditor
