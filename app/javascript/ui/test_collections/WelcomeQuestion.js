import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import pluralize from 'pluralize'

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
    const { givesIncentive, numberOfQuestions } = this.props

    let incentiveMessage = ''
    if (givesIncentive) {
      incentiveMessage = (
        <span>
          , and we’ll reward you <strong>${this.incentive}</strong> for your
          participation
        </span>
      )
    }
    return (
      <QuestionSpacingContainer
        editing={false}
        data-cy="WelcomeQuestionWrapper"
      >
        <QuestionText>
          Thanks for taking the time to provide your feedback here on Shape. We
          look forward to hearing your thoughts!
        </QuestionText>
        <QuestionText>
          There {numberOfQuestions > 1 ? 'are ' : 'is '}
          <strong>{pluralize('questions', numberOfQuestions, true)}</strong> in
          this survey. Completing it should take around{' '}
          <strong>2 minutes</strong>
          {incentiveMessage}.
        </QuestionText>
        <EmojiHolder data-cy="WelcomeQuestionEmojiHolder">
          <EmojiButton
            data-cy="WelcomeQuestionEmojiButton"
            selected={true}
            onClick={this.handleClick('continue')}
          >
            <Emoji size="large" name="Continue" symbol="👉" />
          </EmojiButton>
        </EmojiHolder>
      </QuestionSpacingContainer>
    )
  }
}

WelcomeQuestion.propTypes = {
  onAnswer: PropTypes.func.isRequired,
  numberOfQuestions: PropTypes.number.isRequired,
  givesIncentive: PropTypes.bool.isRequired,
}
WelcomeQuestion.defaultProps = {}

export default WelcomeQuestion
