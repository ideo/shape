import { Link as RouterLink } from 'react-router-dom'
import styled from 'styled-components'

import v from '~/utils/variables'

const Link = styled(RouterLink)`
  color: ${v.colors.blue};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`

export default Link
