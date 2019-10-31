import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import AutosizeInput from 'react-input-autosize'
import { debounce } from 'lodash'

import { Checkbox, Radio } from '~/ui/global/styled/forms'
import Tooltip from '~/ui/global/Tooltip'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

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
    background-color: rgba(255, 255, 255, 0.5);
  }
`
Question.displayName = 'Question'

const Scale = styled.div`
  background-color: ${props => props.theme.responseHolder};
  box-sizing: border-box;
  padding: 7px 13px;
  width: 100%;
`

const ChoicesHolder = styled.div`
  background-color: ${props => props.theme.responseHolder};
  box-sizing: border-box;
  padding: 7px 0;
`

const ChoiceHolder = styled.div`
  background: ${v.colors.commonLight};
  padding: 12px 17px;
  vertical-align: baseline;

  &:hover {
    background: white;
  }
`
const Choice = ({ choice, question }) => (
  <ChoiceHolder>
    {question.question_type === 'question_single_choice' ? (
      <Radio checked={false} onChange={() => {}} value="yes" />
    ) : (
      <Checkbox checked={false} onChange={() => {}} value="yes" />
    )}
    <DisplayText color={v.colors.commonDark}>{choice.text}</DisplayText>
  </ChoiceHolder>
)

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
      color: rgba(255, 255, 255, 0.5);
    }
  }
`
EditableInput.displayName = 'EditableInput'

@observer
class CustomizableQuestion extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      editing: !props.question.content,
      // shouldn't be null otherwise the <input> will complain
      questionContent: props.question.content || '',
    }
    this.debouncedUpdateQuestionContent = debounce(
      this.updateQuestionContent,
      1000
    )
  }

  vote = number => ev => {
    ev.preventDefault()
    this.props.onAnswer({ number })
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

  renderEditableCategory = questionText => {
    const { editing, questionContent } = this.state
    if (!editing)
      return (
        <DisplayText
          color={v.colors.white}
          onClick={this.startEditing}
          alt={`${questionText} ${questionContent}?`}
        >
          {questionText}
          <div className="editable-text">{questionContent}</div>?
        </DisplayText>
      )
    return (
      <DisplayText color={v.colors.white}>
        {questionText}
        <EditableInput
          type="text"
          placeholder="type your category here"
          value={questionContent}
          onChange={this.handleInputChange}
          onKeyPress={this.handleKeyPress}
          onBlur={this.stopEditingIfContent}
        />
        ?
      </DisplayText>
    )
  }

  get question() {
    const { question, editing } = this.props
    const { question_description } = question
    const { questionContent } = this.state
    return (
      <Question editing={editing}>
        <DisplayText color={v.colors.white}>
          {question.content}
          <EditableInput
            type="text"
            placeholder="write question here"
            value={questionContent}
            onChange={this.handleInputChange}
            onKeyPress={this.handleKeyPress}
            onBlur={this.stopEditingIfContent}
          />
        </DisplayText>
      </Question>
    )
  }

  render() {
    const { question, editing, questionAnswer, question_choices } = this.props
    const { question_type } = question
    return (
      <div style={{ width: '100%' }}>
        {this.question}
        <ChoicesHolder>
          {question_choices.map(choice => (
            <Choice choice={choice} question={question} />
          ))}
        </ChoicesHolder>
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
