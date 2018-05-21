import moment from 'moment-mini'
import styled from 'styled-components'
import v from '~/utils/variables'

function defaultFormat(time) {
  const now = moment()
  const m = moment(time)
  if (now.diff(m, 'h') < 24) return 'LT'
  return 'M/DD/YYYY'
}

const StyledDate = styled.span`
  font-size: 12px;
  color: ${v.colors.cloudy};
`

const Moment = ({ date } = {}) => (
  <StyledDate>
    {moment(date).format(defaultFormat(date))}
  </StyledDate>
)

export default Moment
