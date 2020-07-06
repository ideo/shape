import styled from 'styled-components'
import PropTypes from 'prop-types'
import moment from 'moment-mini'
import color from 'color'

import v from '~/utils/variables'

const unfilledBackgroundColor = color(v.colors.black)
  .fade(0.8)
  .string()

const Progress = styled.div`
  height: ${props => (props.height ? props.height : 15)}px;
  width: 100%;
  background-color: ${unfilledBackgroundColor};
`
Progress.displayName = 'Progress'

const ProgressBar = styled.div`
  width: ${props => (props.width ? props.width : 0)}%;
  background-color: ${v.colors.black};
  height: 100%;
`
ProgressBar.displayName = 'ProgressBar'

export const percentOfDateRange = (start, end) => {
  if (!start || !end) return 0

  const now = moment()
  if (now > end) return 100
  if (now < start) return 0

  const totalDistance = end - start
  const nowDistance = now - start

  return Math.round((nowDistance / totalDistance) * 100)
}

const DateProgressBar = ({ startDate, endDate, height } = {}) => {
  return (
    <Progress height={height}>
      <ProgressBar
        width={percentOfDateRange(moment(startDate), moment(endDate))}
      />
    </Progress>
  )
}

DateProgressBar.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  height: PropTypes.number,
}

DateProgressBar.defaultProps = {
  startDate: null,
  endDate: null,
  height: null,
}

export default DateProgressBar
