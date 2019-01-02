import styled from 'styled-components'
import v from '~/utils/variables'

const EmptyList = styled.div`
  font-family: Gotham;
  font-size: 1.5rem;
  line-height: auto;
  letter-spacing: 1px;
  color: #c6c1bf;
  margin: 2rem;

  @media only screen and (max-width: ${v.responsive.muiSmBreakpoint}px) {
    font-size: 1.25rem;
  }
`

export default EmptyList
