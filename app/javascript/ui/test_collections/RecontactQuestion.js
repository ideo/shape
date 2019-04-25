import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from './shared'

@observer
class RecontactQuestion extends React.Component {
  handleClickYes = ev => {
    const { onAnswer, user } = this.props
    user.API_updateCurrentUser({
      feedback_contact_preference: 1,
    })
    onAnswer()
  }

  handleClickNo = ev => {
    const { onAnswer, user } = this.props
    user.API_updateCurrentUser({
      feedback_contact_preference: 2,
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
            selected={user.feedback_contact_preference === 2}
            onClick={this.handleClickNo}
          >
            <Emoji name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={user.feedback_contact_preference === 1}
            onClick={this.handleClickYes}
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
