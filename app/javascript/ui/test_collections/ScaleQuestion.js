import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { debounce } from 'lodash'

import Tooltip from '~/ui/global/Tooltip'
import Emoji from '~/ui/icons/Emoji'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { emojiSeriesMap, questionInformation } from './shared'

const Question = styled.div`
  border-color: ${props =>
    props.editing ? v.colors.gray : v.colors.testLightBlueBg};
  border-bottom-style: solid;
  border-bottom-width: 4px;
  box-sizing: border-box;
  color: white;
  padding: 12px 12px 16px 12px;
  width: 100%;
`
Question.displayName = 'Question'

const Scale = styled.div`
  background-color: ${v.colors.desert};
  box-sizing: border-box;
  color: ${v.colors.ctaButtonBlue};
  padding: 7px 13px;
  width: 100%;

  span {
    color: ${v.colors.ctaButtonBlue};
  }
`

const EmojiHolder = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
`

const EmojiButton = styled.button`
  opacity: ${props => (props.selected ? 1 : 0.5)};
  transition: opacity 0.3s;
  &:hover {
    opacity: 1;
  }
`
EmojiButton.displayName = 'EmojiButton'

@observer
class ScaleQuestion extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      questionContent: props.question.content,
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

  handleChange = event => {
    this.setState({ questionContent: event.target.value })
    this.debouncedUpdateQuestionContent()
  }

  updateQuestionContent = () => {
    const { questionContent } = this.state
    const { question } = this.props
    question.content = questionContent
    question.save()
  }

  renderEditableCategory = questionText => {
    const { questionContent } = this.state
    return (
      <DisplayText>
        {questionText}
        <input
          type="text"
          value={questionContent}
          onChange={this.handleChange}
        />
      </DisplayText>
    )
  }

  render() {
    const { question, editing, questionAnswer } = this.props
    const { emojiSeriesName, questionText } = questionInformation(question)
    const emojis = emojiSeriesMap[emojiSeriesName]
    return (
      <div style={{ width: '100%' }}>
        <Question editing={editing}>
          {this.hasEditableCategory ? (
            this.renderEditableCategory(questionText)
          ) : (
            <DisplayText>{questionText}</DisplayText>
          )}
        </Question>
        <Scale>
          <SmallHelperText>select your response below</SmallHelperText>
          <EmojiHolder>
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
