import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import Emoji from '~/ui/icons/Emoji'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import emojiScales from '~/ui/test_collections/emojiScales'

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
  get emojiScale() {
    const { emojiSeries } = this.props
    return emojiScales[emojiSeries]
  }

  vote = number => ev => {
    ev.preventDefault()
    this.props.onAnswer({ number })
  }

  render() {
    const { editing, questionAnswer, questionText } = this.props
    const emojis = this.emojiScale
    return (
      <div style={{ width: '100%' }}>
        <Question editing={editing}>
          <DisplayText>{questionText}</DisplayText>
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
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  questionText: PropTypes.string.isRequired,
  emojiSeries: PropTypes.oneOf(Object.keys(emojiScales)).isRequired,
  editing: PropTypes.bool,
  onAnswer: PropTypes.func,
}
ScaleQuestion.defaultProps = {
  questionAnswer: null,
  editing: false,
  onAnswer: () => null,
}
export default ScaleQuestion
