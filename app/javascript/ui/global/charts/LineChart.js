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

const LineChart = ({ dataset, order, simpleDateTooltip, cardArea, domain }) => {
  const { measure, timeframe, style, dataWithDates } = dataset
  let tooltipFn
  const values = formatValuesForVictory({
    values: dataWithDates || [],
    addStartDate: dataWithDates[0].date ? null : domain.x[0],
    addEndDate: dataWithDates[0].date ? null : domain.x[1],
  })
  if (simpleDateTooltip) {
    tooltipFn = datum => dateTooltipText(datum, dataset.name)
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
}

LineChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default LineChart
