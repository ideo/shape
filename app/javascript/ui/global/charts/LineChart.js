import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'
import v from '~/utils/variables'
import TickLabelWithTooltip from '~/ui/global/charts/TickLabelWithTooltip'

import {
  datasetPropType,
  dateTooltipText,
  advancedTooltipText,
  lineChartDashWithForOrder,
  domainProps,
  formatValuesForVictory,
} from '~/ui/global/charts/ChartUtils'

const chartStyle = (style, order) => {
  return {
    data: {
      stroke: (style && style.fill) || v.colors.black,
      strokeWidth: 3,
      strokeDasharray: lineChartDashWithForOrder({
        order,
        scale: 1.5,
      }),
    },
  }
}

const LineChart = ({
  dataset,
  order,
  simpleDateTooltip,
  cardArea,
  domain,
  isSmallChartStyle,
}) => {
  const { measure, timeframe, style, dataWithDates } = dataset
  let tooltipFn

  const values = formatValuesForVictory({
    values: dataWithDates || [],
    addStartDate: dataWithDates[0].date ? null : domain.x[0],
    addEndDate: dataWithDates[0].date ? null : domain.x[1],
  })
  if (dataset.data.length === 1) {
    // If theres only one data point, we want the line chart to span whole chart
    values[0].date = domain.x[0]
    values[1].date = domain.x[1]
    // If the whole chart only has one date, we still want line chart to span
    // the whole chart.
    if (domain.x[0] === domain.x[1]) {
      values[1].date = new Date()
    }
  }
  if (simpleDateTooltip) {
    tooltipFn = datum =>
      dateTooltipText(datum, dataset.name, { isSmallChartStyle })
  } else {
    tooltipFn = (datum, isLastDataPoint) =>
      advancedTooltipText({
        datum,
        isLastDataPoint,
        timeframe,
        measure,
      })
  }

  return (
    <VictoryLine
      labels={d => d.value}
      style={chartStyle(style, order)}
      data={values}
      key={`dataset-${order}`}
      y="value"
      x="date"
      labelComponent={
        <TickLabelWithTooltip
          tooltipTextRenderer={tooltipFn}
          labelTextRenderer={datum => `${datum.value}`}
          cardArea={cardArea}
          fontSize={cardArea === 1 ? 18 : 9}
          neverShowLabels
        />
      }
    />
  )
}

LineChart.propTypes = {
  dataset: datasetPropType.isRequired,
  order: PropTypes.number.isRequired,
  simpleDateTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
  domain: domainProps.isRequired,
  isSmallChartStyle: PropTypes.bool.isRequired,
}

LineChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default LineChart
