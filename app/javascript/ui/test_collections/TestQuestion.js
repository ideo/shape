import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCard from '~/ui/grid/GridCard'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import DescriptionQuestion from '~/ui/test_collections/DescriptionQuestion'
import FinishQuestion from '~/ui/test_collections/FinishQuestion'
import NewQuestionGraphic from '~/ui/icons/NewQuestionGraphic'
import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import OpenQuestion from '~/ui/test_collections/OpenQuestion'
import { apiStore, uiStore } from '~/stores'
import QuestionAnswer from '~/stores/jsonApi/QuestionAnswer'
import { QuestionText } from './shared'

const QuestionHolder = styled.div`
  display: flex;
  ${props => props.empty && 'margin-bottom: -6px;'};
`

const QuestionCardWrapper = styled.div`
  width: 334px;
  height: 250px;
`

@observer
class TestQuestion extends React.Component {
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
      questionAnswer = new QuestionAnswer(
        {
          question_id: item.id,
          answer_text: text,
          answer_number: number,
        },
        apiStore
      )
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
    const { parent, card, item, editing, questionAnswer, canEdit } = this.props
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
        return <QuestionCardWrapper>{inner}</QuestionCardWrapper>
      case 'description':
        if (editing) {
          return (
            <DescriptionQuestion
              placeholder="Write idea description here…"
              item={item}
              canEdit={canEdit}
            />
          )
        }
        return <QuestionText>{item.content}</QuestionText>

      case 'open':
        return (
          <OpenQuestion
            item={item}
            editing={editing}
            canEdit={canEdit}
            questionAnswer={questionAnswer}
            onAnswer={this.handleQuestionAnswer}
          />
        )
      case 'finish':
        return <FinishQuestion />
      default:
        return <NewQuestionGraphic />
    }
  }

  render() {
    const { card } = this.props
    return (
      <QuestionHolder empty={!card.card_question_type}>
        {this.renderQuestion()}
      </QuestionHolder>
    )
  }
}

TestQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool.isRequired,
  surveyResponse: MobxPropTypes.objectOrObservableObject,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  createSurveyResponse: PropTypes.func,
  canEdit: PropTypes.bool,
}

TestQuestion.defaultProps = {
  surveyResponse: null,
  questionAnswer: null,
  createSurveyResponse: null,
  canEdit: false,
}

export default TestQuestion
