import PropTypes from 'prop-types'
import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { QuestionText } from './shared'

const FinishedEmojiHolder = styled.div`
  padding: 8px 0;
  text-align: center;
`

const FinishQuestion = ({ submissionBox }) => (
  <div>
    <QuestionText>
      {submissionBox
        ? 'Thank you! You have given feedback on all of the current ideas. Please come back later to review more.'
        : 'You’re done! Thank you for taking the time to provide your opinion.'}
    </QuestionText>
    <FinishedEmojiHolder>
      <Emoji name="Finished" symbol="🎉" />
    </FinishedEmojiHolder>
  </div>
)

FinishQuestion.propTypes = {
  submissionBox: PropTypes.bool,
}
FinishQuestion.defaultProps = {
  submissionBox: false,
}

export default FinishQuestion
