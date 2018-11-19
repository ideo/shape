import styled, { ThemeProvider } from 'styled-components'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import v from '~/utils/variables'
import Emoji from '~/ui/icons/Emoji'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import { LoudDisplayLink } from '~/ui/global/styled/typography'
import {
  EmojiMessageContainer,
  SurveyClosed,
  styledTestTheme,
} from '~/ui/test_collections/shared'

const StyledBg = styled.div`
  background: #e3edee;
  padding-top: 36px;
  padding-bottom: 70px;
  min-height: 100vh;
`

const LogoWrapper = styled.div`
  width: 83px;
  margin: 0 auto 24px;
`

const StyledSurvey = styled.div`
  background-color: ${v.colors.primaryMedium};
  border-radius: 7px;
  border: 10px solid ${v.colors.primaryMedium};
  width: 334px;
  margin: 0 auto;
`

// TODO move blue background, rounded-corner box to shared component

const StyledClosedText = styled.div`
  margin: 10px 0 40px 0;
`

const LearnMoreLink = LoudDisplayLink.extend`
  font-size: 0.75rem;
  letter-spacing: 2px;
  color: ${v.colors.white};
`
LearnMoreLink.displayName = 'LearnMoreLink'

class TestSurveyPage extends React.Component {
  state = {
    surveyResponse: null,
  }

  constructor(props) {
    super(props)
    this.collection = props.collection || apiStore.sync(window.collectionData)
    if (window.nextAvailableId) {
      this.collection.setNextAvailableTestPath(
        `/tests/${window.nextAvailableId}`
      )
    }
  }

  createSurveyResponse = async () => {
    const newResponse = new SurveyResponse(
      {
        test_collection_id: this.collection.id,
      },
      apiStore
    )
    const surveyResponse = await newResponse.save()
    if (surveyResponse) {
      this.setState({ surveyResponse })
    }
    return surveyResponse
  }

  get renderSurvey() {
    const { collection, createSurveyResponse } = this
    const { surveyResponse } = this.state
    if (!collection) return null
    if (collection.test_status === 'live') {
      return (
        <StyledSurvey data-cy="StandaloneTestSurvey">
          <TestSurveyResponder
            collection={collection}
            surveyResponse={surveyResponse}
            createSurveyResponse={createSurveyResponse}
            editing={false}
          />
        </StyledSurvey>
      )
    }
    let message = 'Thank you for stopping by! This feedback is now closed.'
    if (window.noneAvailable) {
      message = 'No ideas are ready to test yet. Please come back later.'
    }
    return (
      <ThemeProvider theme={styledTestTheme('primary')}>
        <StyledSurvey>
          <SurveyClosed>
            <EmojiMessageContainer>
              <Emoji scale={2} name="Raising hands" symbol="🙌" />
            </EmojiMessageContainer>
            <StyledClosedText>{message}</StyledClosedText>
            <LearnMoreLink href={'/'}>Learn More About Shape</LearnMoreLink>
          </SurveyClosed>
        </StyledSurvey>
      </ThemeProvider>
    )
  }

  render() {
    return (
      <StyledBg>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
        {this.renderSurvey}
      </StyledBg>
    )
  }
}

TestSurveyPage.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject,
}

TestSurveyPage.defaultProps = {
  collection: undefined,
}

export default TestSurveyPage
