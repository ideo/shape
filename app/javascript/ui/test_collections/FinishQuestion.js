import PropTypes from 'prop-types'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { FEEDBACK_INCENTIVE_AMOUNT } from '~/utils/variables'
import { QuestionText } from './shared'

const FinishedEmojiHolder = styled.div`
  padding: 8px 0;
  text-align: center;
`

const FinishQuestion = ({ submissionBox, givesIncentive }) => (
  <div>
    <QuestionText>
      {submissionBox
        ? 'Thank you! You have given feedback on all of the current ideas. Please come back later to review more.'
        : 'You’re done! Thank you for taking the time to provide your opinion.'}
    </QuestionText>
    <FinishedEmojiHolder data-cy="FinishedEmojiHolder">
      <Emoji name="Finished" symbol="🎉" />
      {givesIncentive && FEEDBACK_INCENTIVE_AMOUNT && (
        <QuestionText>
          You just earned ${FEEDBACK_INCENTIVE_AMOUNT.toFixed(2)} with this
          survey!
        </QuestionText>
      )}
    </FinishedEmojiHolder>
  </div>
)

FinishQuestion.propTypes = {
  submissionBox: PropTypes.bool,
  givesIncentive: PropTypes.bool,
}
FinishQuestion.defaultProps = {
  submissionBox: false,
  givesIncentive: false,
}

export default FinishQuestion
