import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import AutosizeInput from 'react-input-autosize'
import { debounce } from 'lodash'

import Tooltip from '~/ui/global/Tooltip'
import Emoji from '~/ui/icons/Emoji'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { emojiSeriesForQuestionType } from '~/ui/global/charts/ChartUtils'

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

export const EmojiHolder = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
`

export const EmojiButton = styled.button`
  opacity: ${props => (props.selected ? 1 : 0.2)};
  transition: opacity 0.3s;
  &:hover {
    opacity: 1;
  }
  @media only screen and (max-width: ${v.responsive.muiSmBreakpoint}px) {
    opacity: ${props => (props.selected ? 1 : 0.2)};
    transition: opacity 0.3s;
  }
`
EmojiButton.displayName = 'EmojiButton'

const EditableInput = styled(AutosizeInput)`
  input {
    background-color: rgba(255, 255, 255, 0.5);
    border: 0;
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
    }
  }
`
EditableInput.displayName = 'EditableInput'

@observer
class ScaleQuestion extends React.Component {
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
    return (
      <Question editing={editing}>
        {this.hasEditableCategory ? (
          this.renderEditableCategory(question_description)
        ) : (
          <DisplayText color={v.colors.white}>
            {question_description}
            {/* editable category questions have question.content */}
            {question.content ? ` ${question.content}?` : ''}
          </DisplayText>
        )}
      </Question>
    )
  }

  render() {
    const { question, editing, questionAnswer } = this.props
    const { question_type } = question
    const emojis = emojiSeriesForQuestionType(question_type)
    return (
      <div style={{ width: '100%' }}>
        {this.question}
        <Scale>
          <SmallHelperText>select your response below</SmallHelperText>
          <EmojiHolder data-cy="ScaleEmojiHolder">
            {emojis.map(emoji => (
              <Tooltip
                classes={{ tooltip: 'Tooltip' }}
                title={emoji.name}
                // bottom tooltip interferes with hotspot while editing
                placement={editing ? 'top' : 'bottom'}
                key={emoji.number}
              >
                <div>
                  <EmojiButton
                    // before any are selected they all should be "selected" aka full opacity
                    selected={
                      !questionAnswer ||
                      questionAnswer.answer_number === emoji.number
                    }
                    onClick={this.vote(emoji.number)}
                    // "vote" button is disabled while editing
                    disabled={editing}
                    data-cy="ScaleEmojiBtn"
                  >
                    <Emoji
                      name={emoji.name}
                      symbol={emoji.symbol}
                      scale={emoji.scale}
                    />
                  </EmojiButton>
                </div>
              </Tooltip>
            ))}
          </EmojiHolder>
        </Scale>
      </div>
    )
  }
}

ScaleQuestion.propTypes = {
  question: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  editing: PropTypes.bool,
  onAnswer: PropTypes.func,
}
ScaleQuestion.defaultProps = {
  questionAnswer: null,
  editing: false,
  onAnswer: () => null,
}
export default ScaleQuestion
