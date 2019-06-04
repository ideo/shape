import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from '~/ui/test_collections/shared'
import { FEEDBACK_INCENTIVE_AMOUNT } from '~/utils/variables'
import { QuestionSpacingContainer } from '~/ui/test_collections/OpenQuestion'

@observer
class WelcomeQuestion extends React.Component {
  handleClick = choice => ev => {
    const { onAnswer } = this.props
    onAnswer(choice)
  }

  get incentive() {
    return FEEDBACK_INCENTIVE_AMOUNT.toFixed(2)
  }

  render() {
    const { numberOfQuestions } = this.props

    return (
      <QuestionSpacingContainer editing={false}>
        <QuestionText>
          Thanks for taking the time to provide your feedback here on Shape. We
          look forward to hearing your thoughts!
        </QuestionText>
        <QuestionText>
          There are <strong>{numberOfQuestions} questions</strong> in this
          survey. Completing it should take around <strong>2 minutes</strong>,
          and we’ll reward you <strong>${this.incentive}</strong> for your
          participation.
        </QuestionText>
        <EmojiHolder data-cy="WelcomeQuestionEmojiHolder">
          <EmojiButton selected={true} onClick={this.handleClick('continue')}>
            <Emoji scale={1.375} name="Continue" symbol="👉" />
          </EmojiButton>
        </EmojiHolder>
      </QuestionSpacingContainer>
    )
  }
}

WelcomeQuestion.propTypes = {
  onAnswer: PropTypes.func.isRequired,
  numberOfQuestions: PropTypes.number.isRequired,
}
WelcomeQuestion.defaultProps = {}

export default WelcomeQuestion
