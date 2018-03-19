import styled from 'styled-components'

import v from '~/utils/variables'

const H1 = styled.h1`
  font-family: 'Gotham';
  font-size: 2.25rem;
  font-weight: normal;
  letter-spacing: 2px;
  color: black;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
  white-space: nowrap; /* better this way for responsive? */

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    font-size: 1.5rem;
  }
`

// useful for doing unit testing e.g. wrapper.find('H1')
H1.displayName = 'H1'

export default H1
