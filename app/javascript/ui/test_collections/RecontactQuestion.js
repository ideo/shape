import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from './shared'

const FEEDBACK_CONTACT_YES = 1
const FEEDBACK_CONTACT_NO = 2

@observer
class RecontactQuestion extends React.Component {
  handleClick = choice => ev => {
    const { onAnswer, user } = this.props
    user.API_updateCurrentUser({
      feedback_contact_preference: choice,
    })
    onAnswer()
  }

  render() {
    const { user } = this.props
    return (
      <div>
        <QuestionText>
          Would you like to be contacted about future surveys?
        </QuestionText>
        <EmojiHolder>
          <EmojiButton
            selected={user.feedback_contact_preference === FEEDBACK_CONTACT_NO}
            onClick={this.handleClick(FEEDBACK_CONTACT_NO)}
          >
            <Emoji name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={user.feedback_contact_preference === FEEDBACK_CONTACT_YES}
            onClick={this.handleClick(FEEDBACK_CONTACT_YES)}
          >
            <Emoji name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>
      </div>
    )
  }
}

RecontactQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  onAnswer: PropTypes.func.isRequired,
}

export default RecontactQuestion
