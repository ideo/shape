import styled from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import { QuestionText } from './shared'

const FinishedEmojiHolder = styled.div`
  padding: 8px 0;
  text-align: center;
`

const FinishQuestion = props => (
  <div>
    <QuestionText>
      You’re done! Thank you for taking the time to provide your opinion.
    </QuestionText>
    <FinishedEmojiHolder>
      <Emoji name="Finished" symbol="🎉" />
    </FinishedEmojiHolder>
  </div>
)

export default FinishQuestion
