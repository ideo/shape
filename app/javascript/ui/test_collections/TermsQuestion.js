import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from '~/ui/test_collections/shared'
import { QuestionSpacingContainer } from './OpenQuestion'

@observer
class TermsQuestion extends React.Component {
  @observable
  answered = false
  @observable
  choice = ''

  handleClick = choice => ev => {
    const { onAnswer, user } = this.props

    if (user) {
      user.API_updateCurrentUser({
        respondent_terms_accepted: choice,
      })
    }
    runInAction(() => {
      this.answered = true
      this.choice = choice ? 'yes' : 'no'
    })
    // there was a user, or anon user answered "no", move on
    onAnswer(choice)
  }

  render() {
    const { user } = this.props
    const { answered, choice } = this
    return (
      <QuestionSpacingContainer editing={false}>
        <QuestionText>
          Before continuing, we ask that you read the following statement and
          select the appropriate response.
        </QuestionText>

        <QuestionText fontSizeEm={0.75}>
          The contents of the survey may ask you to provide personal data about
          yourself, including sensitive data such as race or health information.
          It is your choice whether to provide this information and it is
          entirely optional.
          <br />
          <br />
          Any personal data you choose to provide will be stored in the US and
          may be accessed by teams based in different countries, which have
          different personal data laws and may be less strict than the EU for
          example.
          <br />
          <br />
          Only one response per person will be accepted and rewarded.
        </QuestionText>
        <EmojiHolder data-cy="TermsEmojiHolder">
          <EmojiButton
            selected={
              !answered ||
              (answered && user && !user.respondent_terms_accepted) ||
              choice === 'no'
            }
            onClick={this.handleClick(false)}
          >
            <Emoji size="large" name="Disagree" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            data-cy="AcceptFeedbackTerms"
            selected={
              !answered ||
              (answered && user && user.respondent_terms_accepted) ||
              choice === 'yes'
            }
            onClick={this.handleClick(true)}
          >
            <Emoji size="large" name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>
      </QuestionSpacingContainer>
    )
  }
}

TermsQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}
TermsQuestion.defaultProps = {
  user: null,
}

export default TermsQuestion
