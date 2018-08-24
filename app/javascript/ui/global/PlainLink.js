import styled from 'styled-components'
import { Link } from 'react-router-dom'

const PlainLink = styled(Link)`
  color: inherit;
  font-size: inherit;
  text-decoration: none;

  &.no-select {
    user-select: none;
    user-drag: none;
  }
`
PlainLink.displayName = 'PlainLink'

/** @component */
export default PlainLink
