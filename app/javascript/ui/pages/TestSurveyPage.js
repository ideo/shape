import styled from 'styled-components'

import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo'
import Loader from '~/ui/layout/Loader'
import TestDesigner from '~/ui/test_collections/TestDesigner'
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
  border-radius: 7px;
  border: 10px solid ${v.colors.testLightBlueBg};
  width: 334px;
  margin: 0 auto;
`

class TestSurveyPage extends React.Component {
  state = {
    collection: null,
  }
  constructor(props) {
    super(props)
    const collection = apiStore.sync(window.collectionData)
    this.state = {
      collection,
    }
  }

  render() {
    const { collection } = this.state
    let inner = <Loader />

    if (collection) {
      inner = (
        <TestDesigner
          collection={this.state.collection}
          editing={false}
        />
      )
    }
    return (
      <StyledBg>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
        <StyledSurvey>
          {inner}
        </StyledSurvey>
      </StyledBg>
    )
  }
}

export default TestSurveyPage
