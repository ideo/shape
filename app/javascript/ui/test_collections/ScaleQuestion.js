import PropTypes from 'prop-types'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

// TODO deal with new colros
const Question = styled.div`
  background-color: #5698AE;
  color: white;
  padding: 12px 12px 16px 12px;
  width: 310px;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    width: calc(100% - 23px);
  }
`

const Scale = styled.div`
  background-color: ${v.colors.desert};
  color: #5698AE;
  padding: 7px 13px;

  span {
    color: #5698AE;
  }
`

const EmojiHolder = styled.div`
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
        { label: 'terrible', symbol: '👎' },
        { label: 'bad', symbol: '👎' },
        { label: 'good', symbol: '👍' },
        { label: 'great', symbol: '👍' },
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

  vote = (name) => {
  }

  render() {
    const { questionText } = this.props
    const emojis = this.emojiScale
    return (
      <div>
        <Question>
          <DisplayText>
            { questionText }
          </DisplayText>
        </Question>
        <Scale>
          <SmallHelperText>select your response below</SmallHelperText>
          <EmojiHolder>
            { emojis.map(emoji => (
              <button onClick={this.vote(emoji.name)}>
                <Emoji name={emoji.name} symbol={emoji.symbol} />
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
