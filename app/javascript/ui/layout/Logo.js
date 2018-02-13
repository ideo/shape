import styled from 'styled-components'
import { FormattedMessage } from 'react-intl'

const FontStyle = styled.div`
  font-size: 0.75rem;
  font-family: 'Gotham';
  text-transform: uppercase;
`
const Logo = () => (
  <FontStyle>
    <FormattedMessage id="Logo.name" defaultMessage="Innovation OS" />
  </FontStyle>
)

export default Logo
