import styled from 'styled-components'
import v from '~/utils/variables'

import defaultTimeFormat from '~/utils/time'

const StyledDate = styled.span`
  color: ${props => props.color};
  display: inline-block;
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
  white-space: nowrap;
`

const Moment = ({ date } = {}) => (
  <StyledDate>{defaultTimeFormat(date)}</StyledDate>
)

export default Moment
