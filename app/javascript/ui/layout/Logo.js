import styled from 'styled-components'
import { FormattedMessage } from 'react-intl'

const StyledLogo = styled.div`
  font-size: 0.75rem;
  font-family: 'Gotham';
  text-transform: uppercase;
`
const Logo = () => (
  <StyledLogo>
    <FormattedMessage id="Logo.name" defaultMessage="Innovation OS" />
  </StyledLogo>
)

export default Logo
