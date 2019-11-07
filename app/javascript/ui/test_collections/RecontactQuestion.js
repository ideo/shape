import { Fragment } from 'react'
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
  SingleLineInput,
  TextResponseHolder,
  TextEnterButton,
} from '~/ui/test_collections/shared'
import styled from 'styled-components'
import v from '~/utils/variables'
import trackError from '~/utils/trackError'

const IconHolder = styled.div`
  bottom: 14px;
  color: ${props => props.theme.questionText};
  height: 32px;
  position: absolute;
  right: 18px;
  width: 32px;
`

const PostOptInConfirmation = ({
  feedbackContactPreference,
  previouslyAnswered,
}) => {
  let text
  let emoji = '🙌'
  let emojiName = 'Okay gesture'
  if (previouslyAnswered) {
    text = 'Thank you for your time!'
  } else {
    switch (feedbackContactPreference) {
      case 'feedback_contact_yes':
        text = `Great, thanks!
          We'll reach out as soon as we have new feedback opportunities for you.`
        break
      case 'feedback_contact_no':
        text = `We're sorry to hear that. Have a nice day!`
        emoji = '😢'
        emojiName = 'Crying face'
        break
      default:
        // if you haven't answered, then you don't see the PostOptInConfirmation
        return null
    }
  }

  return (
    <Fragment>
      <QuestionText>{text}</QuestionText>
      <EmojiHolder data-cy="PostOptInEmojiHolder">
        <Emoji size="large" name={emojiName} symbol={emoji} />
      </EmojiHolder>
    </Fragment>
  )
}

PostOptInConfirmation.propTypes = {
  feedbackContactPreference: PropTypes.string.isRequired,
  previouslyAnswered: PropTypes.bool.isRequired,
}

@observer
class RecontactQuestion extends React.Component {
  state = {
    showContactInfo: false,
    contactInfo: '',
    submittedContactInfo: false,
    showFeedbackRecontact: 'noIncentiveForGuest',
    feedbackContactPreference: '',
    previouslyAnswered: false,
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

  async createLimitedUser() {
    let user
    const { contactInfo, feedbackContactPreference } = this.state
    const { sessionUid } = this.props
    try {
      const res = await apiStore.createLimitedUser({
        contactInfo,
        feedbackContactPreference,
        sessionUid,
      })
      user = res.data
      const { showFeedbackRecontact } = this.state
      this.setState({
        showFeedbackRecontact: !showFeedbackRecontact
          ? 'afterPaymentInfo'
          : 'noIncentiveForGuest',
        createdUser: user,
      })
    } catch (err) {
      trackError(err, { source: 'createLimitedUser' })
      uiStore.alert(err.error[0])
      return
    }

    return user
  }

  get loggedInOrCreatedUser() {
    return this.props.user || this.state.createdUser
  }

  handleChange = ev => {
    this.setState({ contactInfo: ev.target.value })
  }

  handleClick = choice => ev => {
    const { sessionUid, onAnswer } = this.props
    const user = this.loggedInOrCreatedUser
    this.setState({ feedbackContactPreference: choice })

    if (!user) {
      const showContactInfo = choice === 'feedback_contact_yes'
      this.setState({ showContactInfo })
      return
    }
    if (user) {
      user.API_updateSurveyRespondent(sessionUid, {
        feedback_contact_preference: choice,
      })
    }
    // there was a user, or anon user answered "no", move on
    onAnswer(choice)
  }

  handleContactInfoSubmit = async ev => {
    const { onAnswer } = this.props
    ev.preventDefault()
    const user = await this.createLimitedUser()
    if (!user) return
    const userPreference = user.feedback_contact_preference
    onAnswer(userPreference)
    const previouslyAnswered =
      !user.newly_created && userPreference !== 'feedback_contact_unanswered'
    this.setState({
      feedbackContactPreference: userPreference,
      previouslyAnswered,
      submittedContactInfo: true,
    })
  }

  get backgroundColor() {
    const { backgroundColor } = this.props
    return backgroundColor ? backgroundColor : v.colors.primaryDark
  }

  // I think this should be a separate question
  get showFeedbackRecontactForm() {
    const user = this.loggedInOrCreatedUser
    const { feedbackContactPreference, previouslyAnswered } = this.state
    const selectedPreference =
      (user && user.feedback_contact_preference) || feedbackContactPreference
    if (previouslyAnswered) return

    return (
      <Fragment>
        <QuestionText>
          Would you like to be contacted about future feedback opportunities?
        </QuestionText>
        <EmojiHolder data-cy="RecontactEmojiHolder">
          <EmojiButton
            selected={
              selectedPreference === 'feedback_contact_no' ||
              !selectedPreference
            }
            onClick={this.handleClick('feedback_contact_no')}
          >
            <Emoji size="large" name="Finished" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            selected={
              selectedPreference === 'feedback_contact_yes' ||
              !selectedPreference
            }
            onClick={this.handleClick('feedback_contact_yes')}
            data-cy="RecontactEmojiBtnThumbUp"
          >
            <Emoji size="large" name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>
      </Fragment>
    )
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
          <SingleLineInput
            onChange={this.handleChange}
            value={contactInfo}
            type="questionText"
            placeholder={placeholder}
            data-cy="RecontactTextInput"
            disabled={submittedContactInfo}
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
      feedbackContactPreference,
      previouslyAnswered,
    } = this.state
    return (
      <div style={{ width: '100%', backgroundColor: this.backgroundColor }}>
        {showFeedbackRecontact === 'noIncentiveForGuest' &&
          this.showFeedbackRecontactForm}
        {feedbackContactPreference === 'feedback_contact_no' &&
          !submittedContactInfo && (
            <PostOptInConfirmation
              feedbackContactPreference={feedbackContactPreference}
              previouslyAnswered={previouslyAnswered}
            />
          )}

        {showContactInfo && this.showContactInfoForm}

        {showFeedbackRecontact === 'afterPaymentInfo' &&
          this.showFeedbackRecontactForm}
        {submittedContactInfo && (
          <PostOptInConfirmation
            feedbackContactPreference={feedbackContactPreference}
            previouslyAnswered={previouslyAnswered}
          />
        )}
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
