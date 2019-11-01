import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import AutosizeInput from 'react-input-autosize'

import { debounce } from 'lodash'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CustomizableQuestionChoice from '~/ui/test_collections/CustomizableQuestionChoice'
import ArrowIcon from '../icons/ArrowIcon'
import { TextEnterButton, TextResponseHolder } from './shared'

const Question = styled.div`
  border-color: ${props =>
    props.editing ? props.theme.borderColorEditing : props.theme.borderColor};
  border-bottom-style: solid;
  border-bottom-width: 4px;
  box-sizing: border-box;
  color: white;
  padding: 12px 12px 16px 12px;
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

const EditableInput = styled(AutosizeInput)`
  input {
    background-color: rgba(255, 255, 255, 0);
    border: 0;
    color: white;
    padding: 2px 3px;
    margin: -1px 2px -1px 5px;
    font-size: 16px;
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    color: ${v.colors.white};
    &:focus {
      outline: 0;
    }
    &::placeholder {
      color: ${v.colors.white};
      opacity: 0.5;
    }
  }
`
EditableInput.displayName = 'EditableInput'

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
  }

  submitAnswer = () => {
    const { editing } = this.props
    if (editing) return

    this.props.onAnswer({
      selected_choice_ids: this.state.selected_choice_ids,
    })

    this.setState({ hasSubmittedAnswer: true })
  }

  handleAnswerSelection = choice => ev => {
    const { questionAnswer } = this.props
    let selected_choice_ids = this.hasSubmittedAnswer
      ? questionAnswer.selected_choice_ids
      : this.state.selected_choice_ids

    ev.preventDefault()

    if (this.isSingleChoiceQuestion) {
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
      if (this.isSingleChoiceQuestion) {
        this.submitAnswer()
      }
    })
  }

  updateSingleChoiceIds(selected_choice_ids, choice) {
    if (selected_choice_ids.includes(choice.id)) return []

    return [choice.id]
  }

  updateMultipleChoiceIds(selected_choice_ids, choice) {
    if (selected_choice_ids.includes(choice.id)) {
      // Keep ids that we don't already have
      return selected_choice_ids.filter(id => id != choice.id)
    } else {
      selected_choice_ids.push(choice.id)
      return selected_choice_ids
    }
  }

  get isSingleChoiceQuestion() {
    const { question } = this.props
    return question.question_type === 'question_single_choice'
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

  handleInputChange = event => {
    this.setState({ questionContent: event.target.value })
    this.debouncedUpdateQuestionContent()
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') this.stopEditingIfContent()
  }

  startEditing = () => {
    this.setState({ editing: true })
  }

  stopEditingIfContent = () => {
    const { questionContent } = this.state
    if (!questionContent) return
    this.setState({ editing: false })
  }

  updateQuestionContent = () => {
    const { questionContent } = this.state
    const { question } = this.props
    question.content = questionContent
    question.save()
  }

  get question() {
    const { question, editing } = this.props
    const { questionContent } = this.state
    return (
      <Question editing={editing}>
        <DisplayText color={v.colors.white}>
          <EditableInput
            type="text"
            placeholder="write question here"
            value={questionContent}
            onChange={this.handleInputChange}
            onKeyPress={this.handleKeyPress}
            onBlur={this.stopEditingIfContent}
          />
        </DisplayText>
        <br />
        <SmallHelperText
          color={v.colors.white}
          style={{ marginLeft: '8px', opacity: '0.5' }}
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
    const { question, questionAnswer, editing, question_choices } = this.props
    const { question_type } = question
    return (
      <div style={{ width: '100%' }}>
        {this.question}
        <ChoicesHolder>
          {question_choices.map((choice, index) => (
            <CustomizableQuestionChoice
              disabled={editing}
              isChecked={this.isChoiceSelected(choice)}
              choice={choice}
              questionType={question_type}
              questionAnswer={questionAnswer}
              onChange={this.handleAnswerSelection(choice)}
              key={`question-${question.id}-choice-${index}`}
            />
          ))}
        </ChoicesHolder>
        <TextResponseHolder>
          {!this.isSingleChoiceQuestion && !this.state.hasSubmittedAnswer && (
            <TextEnterButton onClick={this.submitAnswer}>
              <ArrowIcon rotation={90} />
            </TextEnterButton>
          )}
        </TextResponseHolder>
      </div>
    )
  }
}

CustomizableQuestion.propTypes = {
  question: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  editing: PropTypes.bool,
  onAnswer: PropTypes.func,
  question_choices: MobxPropTypes.arrayOrObservableArray,
}
CustomizableQuestion.defaultProps = {
  questionAnswer: null,
  editing: false,
  onAnswer: () => null,
  question_choices: [],
}
export default CustomizableQuestion
