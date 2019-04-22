import PropTypes from 'prop-types'
import { lineChartDashWithForOrder } from '~/ui/global/charts/ChartUtils'

import Icon from './Icon'

const LineChartMeasure = ({ color, order }) => (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <line
        x1="0"
        y1="9"
        x2="16"
        y2="9"
        strokeWidth="2"
        stroke={color}
        strokeDasharray={`${lineChartDashWithForOrder({ order, scale: 0.8 })}`}
      />
    </svg>
  </Icon>
)

LineChartMeasure.propTypes = {
  color: PropTypes.string,
  order: PropTypes.number,
}

LineChartMeasure.defaultProps = {
  color: '#000000',
  order: 0,
}

export default LineChartMeasure
