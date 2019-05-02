import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { apiStore, uiStore } from '~/stores'
import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { QuestionText } from './shared'
import { TextInput, TextResponseHolder, TextEnterButton } from './shared'

const FEEDBACK_CONTACT_YES = 1
const FEEDBACK_CONTACT_NO = 2

@observer
class RecontactQuestion extends React.Component {
  state = { showContactInfo: false, contactInfo: '' }

  async createAndSetCurrentUser(contactInfo) {
    let user
    try {
      const res = await apiStore.createLimitedUser(contactInfo)
      user = res.data
    } catch (err) {
      uiStore.alert(err.error[0])
    }
    apiStore.setCurrentUserInfo({
      id: user.id,
      organizationId: apiStore.currentUserOrganizationId,
    })
  }

  handleChange = ev => {
    this.setState({ contactInfo: ev.target.value })
  }

  handleClick = choice => ev => {
    if (choice === FEEDBACK_CONTACT_YES) {
      this.setState({ showContactInfo: true })
      return
    }
    const { onAnswer } = this.props
    onAnswer()
  }

  handleContactInfoSubmit = async ev => {
    ev.preventDefault()
    await this.createAndSetCurrentUser(this.state.contactInfo)
    user.API_updateCurrentUser({
      feedback_contact_preference: FEEDBACK_CONTACT_YES,
    })
    onAnswer()
  }

  render() {
    const { contactInfo, showContactInfo } = this.state
    return (
      <div>
        <QuestionText>
          Would you like to be contacted about future surveys?
        </QuestionText>
        <EmojiHolder>
          <EmojiButton
            selected={showContactInfo}
            onClick={this.handleClick(FEEDBACK_CONTACT_NO)}
          >
            <Emoji name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={!showContactInfo}
            onClick={this.handleClick(FEEDBACK_CONTACT_YES)}
          >
            <Emoji name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>

        {showContactInfo && (
          <form ref="form" onSubmit={this.handleContactInfoSubmit}>
            <TextResponseHolder>
              <TextInput
                onChange={this.handleChange}
                value={contactInfo}
                type="questionText"
                placeholder="email or phone number"
              />
              <TextEnterButton onClick={this.handleContactInfoSubmit}>
                <ReturnArrowIcon />
              </TextEnterButton>
            </TextResponseHolder>
          </form>
        )}
      </div>
    )
  }
}

RecontactQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}
RecontactQuestion.defaultProps = {
  user: null,
}

export default RecontactQuestion
