import styled from 'styled-components'
import { Link } from 'react-router-dom'

const PlainLink = styled(Link)`
  font-size: inherit;
  text-decoration: none;
  color: ${props => (props.color ? props.color : 'inherit')};

  &.no-select {
    user-select: none;
    user-drag: none;
  }
`
PlainLink.displayName = 'PlainLink'

/** @component */
export default PlainLink
