import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const Question = styled.div`
  border-color: ${props => (props.editing ? v.colors.gray : v.colors.testLightBlueBg)};
  border-bottom-style: solid;
  border-bottom-width: 6px;
  box-sizing: border-box;
  color: white;
  padding: 12px 12px 16px 12px;
  width: 100%;
`

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

const StyledButton = styled.button`
  opacity: ${props => (props.selected ? 1 : 0.5)};
  transition: opacity 0.3s;
  &:hover {
    opacity: 1;
  }
`

@observer
class ScaleQuestion extends React.Component {
  get emojiScale() {
    const { emojiSeries } = this.props
    switch (emojiSeries) {
    case 'thumbs':
      return [
        { number: 1, name: 'terrible', symbol: '👎' },
        { number: 2, name: 'bad', scale: 0.6, symbol: '👎' },
        { number: 3, name: 'good', scale: 0.6, symbol: '👍' },
        { number: 4, name: 'great', symbol: '👍' },
      ]
    case 'faces':
    default:
      return [
        { number: 1, name: 'terrible', symbol: '😡' },
        { number: 2, name: 'bad', symbol: '☹️' },
        { number: 3, name: 'good', symbol: '😊' },
        { number: 4, name: 'great', symbol: '😍' },
      ]
    }
  }

  vote = (number) => (ev) => {
    ev.preventDefault()
    this.props.onAnswer({ number })
  }

  render() {
    const { editing, questionAnswer, questionText } = this.props
    const emojis = this.emojiScale
    return (
      <div style={{ width: '100%' }}>
        <Question editing={editing}>
          <DisplayText>
            {questionText}
          </DisplayText>
        </Question>
        <Scale>
          <SmallHelperText>select your response below</SmallHelperText>
          <EmojiHolder>
            {emojis.map(emoji => (
              <StyledButton
                selected={questionAnswer && questionAnswer.answer_number === emoji.number}
                key={emoji.name}
                onClick={this.vote(emoji.number)}
                // "vote" button is disabled while editing
                disabled={editing}
              >
                <Emoji
                  name={emoji.name}
                  symbol={emoji.symbol}
                  scale={emoji.scale}
                />
              </StyledButton>
            ))}
          </EmojiHolder>
        </Scale>
      </div>
    )
  }
}

ScaleQuestion.propTypes = {
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  questionText: PropTypes.string.isRequired,
  emojiSeries: PropTypes.oneOf(['faces', 'thumbs']),
  editing: PropTypes.bool,
  onAnswer: PropTypes.func,
}
ScaleQuestion.defaultProps = {
  questionAnswer: null,
  emojiSeries: 'faces',
  editing: false,
  onAnswer: () => null,
}
export default ScaleQuestion
