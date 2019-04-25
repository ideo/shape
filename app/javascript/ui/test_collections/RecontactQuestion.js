import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from './shared'

@observer
class RecontactQuestion extends React.Component {
  handleClickYes = ev => {
    const { user } = this.props
    user.should_recontact = true
    user.save()
  }

  handleClickNo = ev => {
    const { user } = this.props
    user.should_recontact = false
    user.save()
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
            selected={user.should_recontact}
            onClick={this.handleClickYes}
          >
            <Emoji name="Yes" symbol="👍" />
          </EmojiButton>
          <EmojiButton selected={false} onClick={this.handleClickNo}>
            <Emoji name="Finished" symbol="👎" />
          </EmojiButton>
        </EmojiHolder>
      </div>
    )
  }
}

RecontactQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RecontactQuestion
