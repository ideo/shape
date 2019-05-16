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
import { observable, action } from 'mobx'
import { observer } from 'mobx-react'

@observer
class ClosedSurvey extends React.Component {
  @observable
  answer = null

  @action
  onAnswer = answer => {
    this.answer = answer
  }

  renderEmoji() {
    switch (this.answer) {
      case 'feedback_contact_yes':
        return <Emoji scale={2} name="Raising hands" symbol="🙌" />
      case 'feedback_contact_no':
        return <Emoji scale={2} name="Okay gesture" symbol="👌" />
      default:
        return <Emoji scale={2} name="Confused face" symbol="😕" />
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

  render() {
    const { includeRecontactQuestion, sessionUid } = this.props

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
                onAnswer={this.onAnswer}
                sessionUid={sessionUid}
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

// TODO move blue background, rounded-corner box to shared component
const StyledClosedText = styled.div`
  margin: 10px 0 40px 0;
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
`
LearnMoreLink.displayName = 'LearnMoreLink'

export default ClosedSurvey
