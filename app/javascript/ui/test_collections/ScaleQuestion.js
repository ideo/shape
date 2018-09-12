import PropTypes from 'prop-types'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

// TODO deal with new colros
const Question = styled.div`
  box-sizing: border-box;
  color: white;
  margin-bottom: 6px;
  padding: 12px 12px 16px 12px;
  width: 100%;
`

const Scale = styled.div`
  background-color: ${v.colors.desert};
  box-sizing: border-box;
  color: #5698AE;
  padding: 7px 13px;
  width: 100%;

  span {
    color: #5698AE;
  }
`

const EmojiHolder = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
`

class ScaleQuestion extends React.Component {
  get emojiScale() {
    const { emojiSeries } = this.props
    switch (emojiSeries) {
    case 'thumbs':
      return [
        { name: 'terrible', symbol: '👎' },
        { name: 'bad', scale: 0.6, symbol: '👎' },
        { name: 'good', scale: 0.6, symbol: '👍' },
        { name: 'great', symbol: '👍' },
      ]
    case 'faces':
    default:
      return [
        { name: 'terrible', symbol: '😡' },
        { name: 'bad', symbol: '☹️' },
        { name: 'good', symbol: '😊' },
        { name: 'great', symbol: '😍' },
      ]
    }
  }

  vote = (name) => (ev) => {
  }

  render() {
    const { questionText } = this.props
    const emojis = this.emojiScale
    return (
      <div style={{ width: '100%' }}>
        <Question>
          <DisplayText>
            {questionText}
          </DisplayText>
        </Question>
        <Scale>
          <SmallHelperText>select your response below</SmallHelperText>
          <EmojiHolder>
            {emojis.map(emoji => (
              <button key={emoji.name} onClick={this.vote(emoji.name)}>
                <Emoji
                  name={emoji.name}
                  symbol={emoji.symbol}
                  scale={emoji.scale}
                />
              </button>
            ))}
          </EmojiHolder>
        </Scale>
      </div>
    )
  }
}

ScaleQuestion.propTypes = {
  questionText: PropTypes.string.isRequired,
  emojiSeries: PropTypes.oneOf(['faces', 'thumbs']),
}
ScaleQuestion.defaultProps = {
  emojiSeries: 'faces',
}
export default ScaleQuestion
