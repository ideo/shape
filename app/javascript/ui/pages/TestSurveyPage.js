import styled from 'styled-components'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'
import SurveyResponse from '~/stores/jsonApi/SurveyResponse'

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
  background-color: ${v.colors.testLightBlueBg};
  border-radius: 7px;
  border: 10px solid ${v.colors.testLightBlueBg};
  width: 334px;
  margin: 0 auto;
`

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

  render() {
    const { collection, createSurveyResponse } = this
    const { surveyResponse } = this.state
    // now that collection is loaded synchronously, no need to display a loader here
    return (
      <StyledBg>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
        <StyledSurvey>
          {collection && (
            <TestSurveyResponder
              collection={collection}
              surveyResponse={surveyResponse}
              createSurveyResponse={createSurveyResponse}
              editing={false}
            />
          )}
        </StyledSurvey>
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
