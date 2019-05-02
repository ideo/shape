import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { apiStore, uiStore } from '~/stores'
import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import OkIcon from '~/ui/icons/OkIcon'
import { QuestionText } from './shared'
import { TextInput, TextResponseHolder, TextEnterButton } from './shared'
import styled from 'styled-components'

const FEEDBACK_CONTACT_YES = 1
const FEEDBACK_CONTACT_NO = 2

const IconHolder = styled.div`
  bottom: 14px;
  color: ${props => props.theme.questionText};
  height: 32px;
  position: absolute;
  right: 18px;
  width: 32px;
`

@observer
class RecontactQuestion extends React.Component {
  state = {
    showContactInfo: false,
    contactInfo: '',
    submittedContactInfo: false,
  }

  async createAndSetCurrentUser(contactInfo) {
    let user
    try {
      const res = await apiStore.createLimitedUser(contactInfo)
      if (!res) throw { errors: ['Contact information invalid'] }
      user = res.data
    } catch (err) {
      uiStore.alert(err.errors[0])
      return
    }
    apiStore.setCurrentUserInfo({
      id: user.id,
      organizationId: apiStore.currentUserOrganizationId,
    })
    return user
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
    const { onAnswer } = this.props
    ev.preventDefault()
    const user = await this.createAndSetCurrentUser(this.state.contactInfo)
    if (!user) return
    user.API_updateCurrentUser({
      feedback_contact_preference: FEEDBACK_CONTACT_YES,
    })
    onAnswer()
    this.setState({ submittedContactInfo: true })
  }

  render() {
    const { contactInfo, showContactInfo, submittedContactInfo } = this.state
    return (
      <div style={{ width: '100%' }}>
        <QuestionText>
          Would you like to be contacted about future surveys?
        </QuestionText>
        <EmojiHolder>
          <EmojiButton
            selected={false}
            onClick={this.handleClick(FEEDBACK_CONTACT_NO)}
          >
            <Emoji name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={showContactInfo}
            onClick={this.handleClick(FEEDBACK_CONTACT_YES)}
          >
            <Emoji name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>

        {showContactInfo && (
          <form ref="form" onSubmit={this.handleContactInfoSubmit}>
            <br />
            <TextResponseHolder>
              <TextInput
                onChange={this.handleChange}
                value={contactInfo}
                type="questionText"
                placeholder="email or phone number"
              />
              {submittedContactInfo ? (
                <IconHolder>
                  <OkIcon />
                </IconHolder>
              ) : (
                <TextEnterButton focused onClick={this.handleContactInfoSubmit}>
                  <ReturnArrowIcon />
                </TextEnterButton>
              )}
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
