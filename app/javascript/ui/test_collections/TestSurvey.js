import styled from 'styled-components'

import v from '~/utils/variables'
import Logo from '~/ui/layout/Logo'
import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'

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

class TestSurvey extends React.Component {
  render() {
    return (
      <StyledBg>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
        <StyledSurvey>
          <ScaleQuestion
            questionText="How satisfied are you with your current solution?"
          />
          <ScaleQuestion
            questionText="How satisfied are you with your current solution?"
          />
          <ScaleQuestion
            questionText="How satisfied are you with your current solution?"
          />
        </StyledSurvey>
      </StyledBg>
    )
  }
}

export default TestSurvey
