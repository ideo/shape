import styled from 'styled-components'
import PropTypes from 'prop-types'
import moment from 'moment-mini'
import color from 'color'

import v from '~/utils/variables'

const unfilledBackgroundColor = color(v.colors.black)
  .fade(0.8)
  .string()

const Progress = styled.div`
  height: 15px;
  width: 100%;
  background-color: ${unfilledBackgroundColor};
`

const ProgressBar = styled.div`
  width: ${props => props.width}%;
  background-color: ${v.colors.black};
  height: 100%;
`

const barWidth = (startDate, endDate) => {
  if (!startDate || !endDate) return 0

  const start = moment(startDate)
  const end = moment(endDate)

  const now = moment()
  if (now > end) return 100
  if (now < start) return 0

  const totalDistance = end - start
  const nowDistance = now - start

  return Math.round((nowDistance / totalDistance) * 100)
}

const DateProgressBar = ({ startDate, endDate } = {}) => {
  return (
    <Progress>
      <ProgressBar width={barWidth(moment(startDate), moment(endDate))} />
    </Progress>
  )
}

DateProgressBar.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
}

DateProgressBar.defaultProps = {
  startDate: null,
  endDate: null,
}

export default DateProgressBar
