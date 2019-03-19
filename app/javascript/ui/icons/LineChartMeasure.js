import PropTypes from 'prop-types'
import Icon from './Icon'

const LineChartMeasure = ({ color, dashWidth }) => (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <line
        x1="0"
        y1="8"
        x2="16"
        y2="8"
        strokeWidth="2"
        stroke={color}
        strokeDasharray={`${dashWidth} ${dashWidth}`}
      />
    </svg>
  </Icon>
)

LineChartMeasure.propTypes = {
  color: PropTypes.string,
  dashWidth: PropTypes.number,
}

LineChartMeasure.defaultProps = {
  color: '#000000',
  dashWidth: 0,
}

export default LineChartMeasure
