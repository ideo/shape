import PropTypes from 'prop-types'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { QuestionText } from './shared'

const FinishedEmojiHolder = styled.div`
  padding: 8px 0;
  text-align: center;
`

const FinishQuestion = ({ submissionBox, incentiveAmount }) => (
  <div>
    <QuestionText>
      {submissionBox
        ? 'Thank you! You have given feedback on all of the current ideas. Please come back later to review more.'
        : 'You’re done! Thank you for taking the time to provide your opinion.'}
    </QuestionText>
    <FinishedEmojiHolder data-cy="FinishedEmojiHolder">
      <Emoji name="Finished" symbol="🎉" />
      {incentiveAmount > 0 && (
        <QuestionText>
          You just earned ${incentiveAmount.toFixed(2)} with this survey!
        </QuestionText>
      )}
    </FinishedEmojiHolder>
  </div>
)

FinishQuestion.propTypes = {
  submissionBox: PropTypes.bool,
  incentiveAmount: PropTypes.number,
}
FinishQuestion.defaultProps = {
  submissionBox: false,
  incentiveAmount: 0,
}

export default FinishQuestion
