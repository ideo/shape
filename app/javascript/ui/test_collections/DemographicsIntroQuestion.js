import Emoji from '~/ui/icons/Emoji'
import {
  QuestionText,
  QuestionSpacingContainer,
} from '~/ui/test_collections/shared'
import { EmojiHolder } from '~/ui/test_collections/ScaleQuestion'

class DemographicsIntroQuestion extends React.Component {
  render() {
    return (
      <div style={{ width: '100%' }}>
        <QuestionSpacingContainer
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <EmojiHolder data-cy="RecontactEmojiHolder">
            <Emoji
              name="A telescope mounted on a tripod."
              symbol="🔭"
              scale={1.5}
            />
          </EmojiHolder>
          <QuestionText>
            Please answer a few questions to help us direct you to the next
            survey. The more you answer, the more opportunities we can find for
            you.
          </QuestionText>
        </QuestionSpacingContainer>
      </div>
    )
  }
}

export default DemographicsIntroQuestion
