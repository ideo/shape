import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { apiStore, uiStore } from '~/stores'
import { DisplayText } from '~/ui/global/styled/typography'
import Emoji from '~/ui/icons/Emoji'
import {
  EmojiButton,
  EmojiHolder,
  QuestionText,
  TextInput,
  TextResponseHolder,
  TextEnterButton,
} from '~/ui/test_collections/shared'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import OkIcon from '~/ui/icons/OkIcon'
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
    showFeedbackRecontact: 'noIncentiveForGuest',
    answer: '',
    createdUser: null,
  }

  componentDidMount() {
    const { user, givesIncentive } = this.props
    if (!user && givesIncentive) {
      // this is the state with a guest user and a test with an incentive
      // we need to ask for their info before asking to recontact
      this.setState({
        showFeedbackRecontact: false,
        showContactInfo: true,
      })
    } else if (user) {
      this.setState({
        submittedContactInfo: true,
      })
    }
  }

  async createLimitedUser(contactInfo) {
    let user
    const { sessionUid } = this.props
    try {
      const res = await apiStore.createLimitedUser({ contactInfo, sessionUid })
      if (!res) {
        throw { errors: ['Contact information invalid'] }
        return
      }
      user = res.data
      const { showFeedbackRecontact } = this.state
      this.setState({
        showFeedbackRecontact: !showFeedbackRecontact
          ? 'afterPaymentInfo'
          : 'noIncentiveForGuest',
        createdUser: user,
      })
      apiStore.loadCurrentUser()
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
    const { onAnswer } = this.props
    const user = this.props.user || this.state.createdUser
    this.setState({ answer: choice })

    if (!user) {
      const showContactInfo = choice === 'feedback_contact_yes'
      this.setState({ showContactInfo })
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
    const created = await this.createLimitedUser(contactInfo)
    if (!created) return
    onAnswer('feedback_contact_yes')
    // Why is this setting feedback contact yes?
    // Isn't this only for getting money?
    this.setState({ submittedContactInfo: true })
  }

  get backgroundColor() {
    const { backgroundColor } = this.props
    return backgroundColor ? backgroundColor : v.colors.primaryDark
  }

  // I think this should be a separate question
  get showFeedbackRecontactForm() {
    const { user } = this.props
    const { answer } = this.state
    return (
      <React.Fragment>
        <QuestionText>
          Would you like to be contacted about future feedback opportunities?
        </QuestionText>
        <EmojiHolder data-cy="RecontactEmojiHolder">
          <EmojiButton
            selected={
              (user &&
                user.feedback_contact_preference === 'feedback_contact_no') ||
              answer === 'feedback_contact_no' ||
              !answer
            }
            onClick={this.handleClick('feedback_contact_no')}
          >
            <Emoji size="large" name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={
              !answer ||
              (user &&
                user.feedback_contact_preference === 'feedback_contact_yes') ||
              answer === 'feedback_contact_yes'
            }
            onClick={this.handleClick('feedback_contact_yes')}
            data-cy="RecontactEmojiBtnThumbUp"
          >
            <Emoji size="large" name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>
      </React.Fragment>
    )
  }

  get showPostOptInConfirmation() {
    switch (this.state.answer) {
      case 'feedback_contact_yes':
        return (
          <div>
            <QuestionText>
              Great, thanks! We'll reach out as soon as we have new feedback
              opportunities for you.
            </QuestionText>
            <EmojiHolder data-cy="PostOptInEmojiHolder">
              <Emoji size="large" name="Okay gesture" symbol="🙌" />
            </EmojiHolder>
          </div>
        )
      case 'feedback_contact_no':
        return (
          <div>
            <QuestionText>
              We're sorry to hear that. Have a nice day!
            </QuestionText>
            <EmojiHolder data-cy="PostOptInEmojiHolder">
              <Emoji size="large" name="crying face" symbol="😢" />
            </EmojiHolder>
          </div>
        )
      default:
        return null
    }
  }

  get showContactInfoForm() {
    const {
      contactInfo,
      submittedContactInfo,
      showFeedbackRecontact,
    } = this.state

    const placeholder = `email${
      showFeedbackRecontact === 'noIncentiveForGuest' ? ' or phone number' : ''
    }`

    return (
      <form ref="form" onSubmit={this.handleContactInfoSubmit}>
        <div style={{ padding: '16px 20px' }}>
          {showFeedbackRecontact === 'noIncentiveForGuest' && (
            <div>
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
          )}
          {(!showFeedbackRecontact ||
            showFeedbackRecontact === 'afterPaymentInfo') && (
            <div>
              <DisplayText color={v.colors.white}>
                Please enter an email in order to receive your payment.
              </DisplayText>
              <br />
            </div>
          )}
        </div>
        <TextResponseHolder>
          <TextInput
            onChange={this.handleChange}
            value={contactInfo}
            type="questionText"
            placeholder={placeholder}
            data-cy="RecontactTextInput"
          />
          {submittedContactInfo ? (
            <IconHolder>
              <OkIcon />
            </IconHolder>
          ) : (
            <TextEnterButton
              focused
              onClick={this.handleContactInfoSubmit}
              data-cy="RecontactTextResponseButton"
            >
              <ReturnArrowIcon />
            </TextEnterButton>
          )}
        </TextResponseHolder>
      </form>
    )
  }

  render() {
    const {
      showContactInfo,
      showFeedbackRecontact,
      submittedContactInfo,
      answer,
    } = this.state
    return (
      <div style={{ width: '100%', backgroundColor: this.backgroundColor }}>
        {showFeedbackRecontact === 'noIncentiveForGuest' &&
          this.showFeedbackRecontactForm}
        {answer === 'feedback_contact_no' &&
          !submittedContactInfo &&
          this.showPostOptInConfirmation}

        {showContactInfo && this.showContactInfoForm}

        {showFeedbackRecontact === 'afterPaymentInfo' &&
          this.showFeedbackRecontactForm}
        {submittedContactInfo && this.showPostOptInConfirmation}
      </div>
    )
  }
}

RecontactQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
  sessionUid: PropTypes.string,
  backgroundColor: PropTypes.string,
  givesIncentive: PropTypes.bool,
}
RecontactQuestion.defaultProps = {
  user: null,
  backgroundColor: null,
  sessionUid: null,
  givesIncentive: false,
}

export default RecontactQuestion
