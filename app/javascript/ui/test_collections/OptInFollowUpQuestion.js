import PropTypes from 'prop-types'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { QuestionText } from '~/ui/test_collections/shared'

const StyledEmojiHolder = styled.div`
  padding: 8px 0;
  text-align: center;
`

const OptInFollowUpQuestion = ({ acceptOptIn }) => (
  <div>
    <QuestionText>
      {acceptOptIn
        ? "Great, thanks! We'll reach out as soon as we have new feedback opportunities for you."
        : "We're sorry to hear that. Have a nice day!"}
    </QuestionText>
    <StyledEmojiHolder data-cy="StyledEmojiHolder">
      {acceptOptIn ? (
        <Emoji name="Okay gesture" symbol="👌" />
      ) : (
        <Emoji name="crying face" symbol="😢" />
      )}
    </StyledEmojiHolder>
  </div>
)

OptInFollowUpQuestion.propTypes = {
  acceptOptIn: PropTypes.bool.isRequired,
}
OptInFollowUpQuestion.defaultProps = {
  // acceptOptIn: false,
}

export default OptInFollowUpQuestion
