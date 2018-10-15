import styled from 'styled-components'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'
import { LoudDisplayLink } from '~/ui/global/styled/typography'

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
const StyledSurveyClosed = styled.div`
  border-radius: 7px;
  margin: 100px auto 0 auto;
  background-color: ${v.colors.ctaButtonBlue};
  width: 272px;
  padding: 30px;
  font-size: 1.25rem;
  font-family: ${v.fonts.sans};
  color: ${v.colors.white};
  text-align: center;
`
StyledSurveyClosed.displayName = 'StyledSurveyClosed'

const StyledClosedText = styled.div`
  margin: 10px 0 40px 0;
`

const StyledHandsEmoji = styled.div`
  margin-top: 20px;
  font-size: 80px;
`

const LearnMoreLink = LoudDisplayLink.extend`
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
        <StyledSurvey>
          <TestSurveyResponder
            collection={collection}
            surveyResponse={surveyResponse}
            createSurveyResponse={createSurveyResponse}
            editing={false}
          />
        </StyledSurvey>
      )
    }
    return (
      <StyledSurveyClosed>
        <StyledHandsEmoji>
          <span role="img" aria-label="Raising Hands">
            🙌
          </span>
        </StyledHandsEmoji>
        <StyledClosedText>
          Thank you for stopping by! This feedback is now closed.
        </StyledClosedText>
        <LearnMoreLink href={'/'}>Learn More About Shape</LearnMoreLink>
      </StyledSurveyClosed>
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
