import styled from 'styled-components'
import { FormattedMessage } from 'react-intl'
import v from '~/utils/variables'

const StyledLogo = styled.div`
  margin-bottom: 15px;

  & img {
    width: 81.7px;
  }
`

const Logo = () => (
  <StyledLogo>
    <img
      src="https://s3-us-west-2.amazonaws.com/assets.shape.space/shape-logo.png"
      alt="Shape"
    />
  </StyledLogo>
)

export default Logo
