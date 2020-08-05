import PropTypes from 'prop-types'
import { debounce } from 'lodash'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, runInAction } from 'mobx'
import styled from 'styled-components'

import ArrowIcon from '../icons/ArrowIcon'
import CustomizableQuestionChoice from '~/ui/test_collections/CustomizableQuestionChoice'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import {
  TextInput,
  TextEnterButton,
  TextResponseHolder,
} from '~/ui/test_collections/shared'
import v from '~/utils/variables'

const Question = styled.div`
  border-color: ${props =>
    props.editing ? props.theme.borderColorEditing : props.theme.borderColor};
  border-bottom-style: solid;
  border-bottom-width: 4px;
  box-sizing: border-box;
  color: white;
  line-height: 1;
  padding: 12px 3px;
  width: 100%;
  .editable-text {
    margin: -1px -1px -1px 5px;
    padding: 2px 3px;
    transition: background-color 250ms;
    display: inline-block;
  }
  &:hover .editable-text {
    background-color: ${v.colors.white};
    opacity: 0.5;
  }
`
Question.displayName = 'Question'

const EditableInputHolder = styled(TextResponseHolder)`
  background-color: rgba(255, 255, 255, 0);
  padding: 0;
`
EditableInputHolder.displayName = 'EditableInputHolder'

const ChoicesHolder = styled.div`
  background-color: ${props => props.theme.responseHolder};
  box-sizing: border-box;
  padding: 7px 0;
`

@observer
class CustomizableQuestion extends React.Component {
  constructor(props) {
    super(props)
    const choice_ids = props.questionAnswer
      ? props.questionAnswer.selected_choice_ids
      : []
    this.state = {
      editing: !props.question.content,
      // shouldn't be null otherwise the <input> will complain
      questionContent: props.question.content || '',
      selected_choice_ids: choice_ids,
      hasSubmittedAnswer: false,
    }
    this.debouncedUpdateQuestionContent = debounce(
      this.updateQuestionContent,
      250
    )
    this.instanceQuestionContentUpdate = debounce(
      this._instanceQuestionContentUpdate,
      30000
    )
  }

  submitAnswer = () => {
    const { editing } = this.props
    if (editing) return

    this.props.onAnswer({
      selected_choice_ids: this.state.selected_choice_ids,
      skipScrolling: this.isAnswerSavedinDB,
    })

    this.setState({ hasSubmittedAnswer: true })
  }

  handleAnswerSelection = choice => ev => {
    const { questionAnswer, question } = this.props
    let selected_choice_ids = this.hasSubmittedAnswer
      ? questionAnswer.selected_choice_ids
      : this.state.selected_choice_ids

    ev.preventDefault()

    if (question.isSingleChoiceQuestion) {
      selected_choice_ids = this.updateSingleChoiceIds(
        selected_choice_ids,
        choice
      )
    } else {
      selected_choice_ids = this.updateMultipleChoiceIds(
        selected_choice_ids,
        choice
      )
    }

    this.setState({ selected_choice_ids }, () => {
      if (question.isSingleChoiceQuestion || this.isAnswerSavedinDB) {
        this.submitAnswer()
      }
    })
  }

  get isAnswerSavedinDB() {
    const { questionAnswer } = this.props
    if (questionAnswer) {
      return questionAnswer.selected_choice_ids.length > 0
    }
    return false
  }

  updateSingleChoiceIds(selected_choice_ids, choice) {
    if (selected_choice_ids.includes(choice.id)) return []

    return [choice.id]
  }

  updateMultipleChoiceIds(selected_choice_ids, choice) {
    if (selected_choice_ids.includes(choice.id)) {
      // Keep ids that we don't already have
      return selected_choice_ids.filter(id => id !== choice.id)
    } else {
      runInAction(() => {
        selected_choice_ids.push(choice.id)
      })
      return selected_choice_ids
    }
  }

  isChoiceSelected = choice => {
    return this.state.selected_choice_ids.includes(choice.id)
  }

  get hasEditableCategory() {
    const { question, editing } = this.props
    if (question.question_type === 'question_category_satisfaction' && editing)
      return true
    return false
  }

  _instanceQuestionContentUpdate = () => {
    const { handleInstanceQuestionContentUpdate } = this.props

    if (handleInstanceQuestionContentUpdate) {
      handleInstanceQuestionContentUpdate()
    }
  }

  handleInputChange = event => {
    this.setState({ questionContent: event.target.value })
    this.debouncedUpdateQuestionContent()
    this.instanceQuestionContentUpdate()
  }

  handleBlur = () => {
    const { questionContent } = this.state
    this.debouncedUpdateQuestionContent.flush()
    this.instanceQuestionContentUpdate.flush()

    if (!questionContent) return

    this.setState({ editing: false })
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') this.stopEditingIfContent()
  }

  @action
  onDeleteChoice = choice => {
    const { question, editing, isTestDraft } = this.props
    if (!editing) return
    if (isTestDraft) {
      question.API_destroyQuestionChoice(choice)
    } else {
      question.API_archiveQuestionChoice(choice)
    }
  }

  startEditing = () => {
    this.setState({ editing: true })
  }

  updateQuestionContent = () => {
    const { questionContent } = this.state
    const { question } = this.props
    question.content = questionContent
    question.save()
  }

  get question() {
    const { question, editing, handleFocus } = this.props
    const { questionContent } = this.state
    return (
      <Question editing={editing}>
        <DisplayText color={v.colors.white}>
          <EditableInputHolder>
            <TextInput
              onFocus={handleFocus}
              onChange={this.handleInputChange}
              onKeyPress={this.handleKeyPress}
              onBlur={this.handleBlur}
              value={questionContent}
              type="descriptionText"
              placeholder="write question here"
              data-cy="CustomizableQuestionTextInput"
              disabled={!editing}
            />
          </EditableInputHolder>
        </DisplayText>
        <SmallHelperText
          color={v.colors.white}
          style={{ marginLeft: '10px', opacity: '0.5' }}
        >
          {question.question_type === 'question_multiple_choice' ? (
            <span>please select all options that apply</span>
          ) : (
            <span>please select one option</span>
          )}
        </SmallHelperText>
      </Question>
    )
  }

  render() {
    const {
      question,
      questionAnswer,
      editing,
      question_choices,
      handleInstanceQuestionContentUpdate,
    } = this.props

    return (
      <div style={{ width: '100%' }}>
        {this.question}
        <ChoicesHolder>
          {question_choices
            .sort((choiceA, choiceB) => choiceA.order - choiceB.order)
            .map((choice, index) => (
              <CustomizableQuestionChoice
                isChecked={this.isChoiceSelected(choice)}
                choice={choice}
                placeholder={`Option ${index + 1}`}
                isSingleChoiceQuestion={question.isSingleChoiceQuestion}
                questionAnswer={questionAnswer}
                onChange={this.handleAnswerSelection(choice)}
                key={`question-${question.id}-choice-${index}`}
                editing={editing}
                onCreate={this.onNewChoice}
                onDelete={this.onDeleteChoice}
                handleInstanceQuestionContentUpdate={
                  handleInstanceQuestionContentUpdate
                }
              />
            ))}
        </ChoicesHolder>
        {!question.isSingleChoiceQuestion &&
          !this.state.hasSubmittedAnswer &&
          !editing && (
            <TextResponseHolder style={{ padding: '20px' }}>
              <TextEnterButton onClick={this.submitAnswer}>
                <ArrowIcon rotation={90} />
              </TextEnterButton>
            </TextResponseHolder>
          )}
      </div>
    )
  }
}

CustomizableQuestion.propTypes = {
  question: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  editing: PropTypes.bool,
  question_choices: MobxPropTypes.arrayOrObservableArray,
  isTestDraft: PropTypes.bool,
  onAnswer: PropTypes.func,
  handleFocus: PropTypes.func,
  handleInstanceQuestionContentUpdate: PropTypes.func,
}
CustomizableQuestion.defaultProps = {
  questionAnswer: null,
  editing: false,
  onAnswer: () => null,
  handleFocus: () => true,
  question_choices: [],
  isTestDraft: false,
  onAnswer: PropTypes.func,
  handleFocus: PropTypes.func,
  handleInstanceQuestionContentUpdate: () => true,
}
export default CustomizableQuestion
