import styled from 'styled-components'
import { FormattedMessage } from 'react-intl'
import v from '~/utils/variables'

const StyledLogo = styled.div`
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.medium};
  text-transform: uppercase;
`
const Logo = () => (
  <StyledLogo>
    <FormattedMessage id="Logo.name" defaultMessage="Shape" />
  </StyledLogo>
)

export default Logo
