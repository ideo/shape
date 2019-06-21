import { observer, PropTypes as MobxPropTypes, inject } from 'mobx-react'
import { observable, action } from 'mobx'
import styled, { ThemeProvider } from 'styled-components'

import Emoji from '~/ui/icons/Emoji'
import {
  EmojiMessageContainer,
  SurveyClosed,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import v from '~/utils/variables'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import { LoudDisplayLink } from '~/ui/global/styled/typography'
import RecontactQuestion from '~/ui/test_collections/RecontactQuestion'

// TODO move blue background, rounded-corner box to shared component
const StyledClosedText = styled.div`
  margin: 10px 0 40px 0;
  font-size: 1.25rem;
  line-height: 20px;
  text-align: center;
  padding-left: 44px;
  padding-right: 44px;
`

const StyledSurvey = styled.div`
  background-color: ${v.colors.primaryMedium};
  border-radius: 7px;
  border: 10px solid ${v.colors.primaryMedium};
  box-sizing: border-box;
  width: 100%;
  margin: 0 auto;
  max-width: 580px; /* responsive but constrain media QuestionCards to 420px tall */
`

const LearnMoreLink = LoudDisplayLink.extend`
  font-size: 0.75rem;
  letter-spacing: 2px;
  color: ${v.colors.white};
  text-align: center;
`
LearnMoreLink.displayName = 'LearnMoreLink'

@inject('apiStore')
@observer
class ClosedSurvey extends React.Component {
  @observable
  answer = null
  @observable
  surveyResponse = null

  async componentDidMount() {
    this.initializeCards()

    const { apiStore } = this.props
    await apiStore.loadCurrentUser()
    if (!apiStore.currentUser) return
    await this.fetchSurveyResponse()
  }

  @action
  onAnswer = answer => {
    this.answer = answer
  }

  async fetchSurveyResponse() {
    const { collection, apiStore } = this.props
    const surveyResponseId = collection.survey_response_for_user_id
    const surveyResponseResult =
      surveyResponseId &&
      (await apiStore.fetch('survey_responses', surveyResponseId))
    const surveyResponse = surveyResponseResult
      ? surveyResponseResult.data
      : null
    this.surveyResponse = surveyResponse
  }

  renderEmoji() {
    switch (this.answer) {
      case 'feedback_contact_yes':
        return <Emoji size="xl" name="Raising hands" symbol="🙌" />
      case 'feedback_contact_no':
        return <Emoji size="xl" name="Okay gesture" symbol="👌" />
      default:
        return <Emoji size="xl" name="Confused face" symbol="😕" />
    }
  }

  get message() {
    if (window.noneAvailable) {
      return 'No ideas are ready to test yet. Please come back later.'
    }
    switch (this.answer) {
      case 'feedback_contact_yes':
        return "Great, thanks! We'll reach out as soon as we have new feedback opportunities for you."
      case 'feedback_contact_no':
        return "Okay, we won't contact you about future feedback opportunities."
      default:
        return 'Sorry! This survey has now been closed.'
    }
  }

  get currentUser() {
    const { apiStore } = this.props
    const { currentUser } = apiStore

    return currentUser
  }

  get sessionUid() {
    const { surveyResponse } = this

    surveyResponse ? surveyResponse.session_uid : null
  }

  get includeRecontactQuestion() {
    return (
      !this.currentUser ||
      this.currentUser.feedback_contact_preference ===
        'feedback_contact_unanswered'
    )
  }

  render() {
    const { currentUser, includeRecontactQuestion } = this

    return (
      <ThemeProvider theme={styledTestTheme('primary')}>
        <StyledSurvey>
          <DialogWrapper />
          <SurveyClosed>
            <EmojiMessageContainer>{this.renderEmoji()}</EmojiMessageContainer>
            <StyledClosedText>{this.message}</StyledClosedText>
            {includeRecontactQuestion && !this.answer ? (
              <RecontactQuestion
                backgroundColor={v.colors.primaryDarkest}
                user={currentUser}
                onAnswer={this.onAnswer}
                sessionUid={this.sessionUid}
              />
            ) : (
              <LearnMoreLink href={'/'}>Learn More About Shape</LearnMoreLink>
            )}
          </SurveyClosed>
        </StyledSurvey>
      </ThemeProvider>
    )
  }
}

ClosedSurvey.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject,
}

ClosedSurvey.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

ClosedSurvey.defaultProps = {
  collection: undefined,
}

export default ClosedSurvey
