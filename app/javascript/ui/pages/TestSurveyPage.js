import styled from 'styled-components'

import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { apiStore } from '~/stores'
// import Collection from '~/stores/jsonApi/Collection'

const StyledBg = styled.div`
  background: #e3edee;
  padding-top: 36px;
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
  constructor(props) {
    super(props)
    this.collection = apiStore.sync(window.collectionData)
  }

  render() {
    const { collection } = this
    // now that collection is loaded synchronously, no need to display a loader here
    let inner = ''

    if (collection) {
      inner = <TestSurveyResponder collection={collection} editing={false} />
    }
    return (
      <StyledBg>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
        <StyledSurvey>{inner}</StyledSurvey>
      </StyledBg>
    )
  }
}

export default TestSurveyPage
