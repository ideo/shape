import moment from 'moment-mini'
import styled from 'styled-components'
import v from '~/utils/variables'

function defaultFormat(time) {
  const now = moment()
  const m = moment(time)
  if (now.diff(m, 'h') < 24) {
    // 4:32pm
    return 'LT'
  } else if (now.diff(m, 'h') >= 24 && now.diff(m, 'days') < 365) {
    // Nov 28th
    return 'MMM Do'
  }
  // Nov 28th, 2017
  return 'MMM Do, YYYY'
}

const StyledDate = styled.span`
  color: ${props => props.color};
  display: inline-block;
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
  white-space: nowrap;
`

const Moment = ({ date } = {}) => (
  <StyledDate>{moment(date).format(defaultFormat(date))}</StyledDate>
)

export default Moment
