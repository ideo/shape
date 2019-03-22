import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import {
  datasetPropType,
  dateTooltipText,
  advancedTooltipText,
  addDuplicateValueIfSingleValue,
  chartDomainForDatasetValues,
  lineChartDashWithForOrder,
} from '~/ui/global/charts/ChartUtils'

const formatValues = values => {
  const formatted = addDuplicateValueIfSingleValue(values)
  return formatted.map((datum, i) => ({
    ...datum,
    x: i + 1,
    y: datum.value,
  }))
}

const chartStyle = dataset => {
  const { style } = dataset
  return {
    data: {
      stroke: (style && style.fill) || '#000000',
      strokeWidth: 3,
      strokeDasharray: lineChartDashWithForOrder({
        order: dataset.order,
        scale: 1.5,
      }),
    },
  }
}

const LineChart = ({ dataset, simpleDateTooltip, cardArea }) => {
  const { measure, timeframe } = dataset
  const values = formatValues(dataset.data)
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: dataset.max_domain,
  })
  let tooltipFn
  if (simpleDateTooltip) {
    tooltipFn = datum => dateTooltipText(datum)
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
      labelComponent={
        <ChartTooltip textRenderer={tooltipFn} cardArea={cardArea} />
      }
      style={chartStyle(dataset)}
      data={values}
      domain={domain}
      key={`dataset-${dataset.measure}`}
    />
  )
}

LineChart.propTypes = {
  dataset: datasetPropType.isRequired,
  simpleDateTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
}

LineChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default LineChart
