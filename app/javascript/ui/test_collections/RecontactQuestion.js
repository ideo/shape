import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { apiStore, uiStore } from '~/stores'
import { DisplayText } from '~/ui/global/styled/typography'
import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import OkIcon from '~/ui/icons/OkIcon'
import {
  QuestionText,
  TextInput,
  TextResponseHolder,
  TextEnterButton,
} from '~/ui/test_collections/shared'
import styled from 'styled-components'
import v from '~/utils/variables'

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

  async createLimitedUser(contactInfo) {
    let user
    const { sessionUid } = this.props
    try {
      const res = await apiStore.createLimitedUser({ contactInfo, sessionUid })
      if (!res) throw { errors: ['Contact information invalid'] }
      user = res.data
    } catch (err) {
      uiStore.alert(err.errors[0])
      return
    }

    return user
  }

  handleChange = ev => {
    this.setState({ contactInfo: ev.target.value })
  }

  handleClick = choice => ev => {
    const { onAnswer, user } = this.props
    if (choice === 'feedback_contact_yes' && !user) {
      this.setState({ showContactInfo: true })
      return
    }
    if (user) {
      user.API_updateCurrentUser({
        feedback_contact_preference: choice,
      })
    }
    // there was a user, or anon user answered "no", move on
    onAnswer(choice)
  }

  handleContactInfoSubmit = async ev => {
    const { onAnswer } = this.props
    const { contactInfo } = this.state
    ev.preventDefault()
    const created = this.createLimitedUser(contactInfo)
    if (!created) return
    onAnswer('feedback_contact_yes')
    this.setState({ submittedContactInfo: true })
  }

  get backgroundColor() {
    const { backgroundColor } = this.props
    return backgroundColor ? backgroundColor : v.colors.primaryDark
  }

  render() {
    const { user } = this.props
    const { contactInfo, showContactInfo, submittedContactInfo } = this.state
    return (
      <div style={{ width: '100%', backgroundColor: this.backgroundColor }}>
        <QuestionText>
          Would you like to be contacted about future feedback opportunities?
        </QuestionText>
        <EmojiHolder>
          <EmojiButton
            selected={
              // default to true for no user and then set for limited user
              user && user.feedback_contact_preference === 'feedback_contact_no'
            }
            onClick={this.handleClick('feedback_contact_no')}
          >
            <Emoji scale={1.375} name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={
              showContactInfo ||
              (user &&
                user.feedback_contact_preference === 'feedback_contact_yes')
            }
            onClick={this.handleClick('feedback_contact_yes')}
          >
            <Emoji scale={1.375} name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>

        {showContactInfo && (
          <form ref="form" onSubmit={this.handleContactInfoSubmit}>
            <div style={{ padding: '16px 20px' }}>
              <DisplayText color={v.colors.white}>
                Please enter an email or mobile number to be recontacted.
              </DisplayText>
              <br />
              <br />
              <DisplayText color={v.colors.white}>
                Surveys are time sensitive, so entering a mobile number will
                allow us to reach you more quickly.
              </DisplayText>
              <br />
            </div>
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
  sessionUid: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
}
RecontactQuestion.defaultProps = {
  user: null,
  backgroundColor: null,
}

export default RecontactQuestion
