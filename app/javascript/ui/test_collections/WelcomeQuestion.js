import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import pluralize from 'pluralize'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from '~/ui/test_collections/shared'
import { QuestionSpacingContainer } from '~/ui/test_collections/OpenQuestion'

@observer
class WelcomeQuestion extends React.Component {
  handleClick = choice => ev => {
    const { onAnswer } = this.props
    onAnswer(choice)
  }

  render() {
    const { potentialIncentive, numberOfQuestions } = this.props
    let incentiveMessage = ''
    if (potentialIncentive > 0) {
      incentiveMessage = (
        <span>
          , and we’ll reward you{' '}
          <strong>${potentialIncentive.toFixed(2)}</strong> for your
          participation
        </span>
      )
    }
    return (
      <QuestionSpacingContainer editing={false}>
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
        <EmojiHolder>
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
  potentialIncentive: PropTypes.number.isRequired,
}
WelcomeQuestion.defaultProps = {}

export default WelcomeQuestion
