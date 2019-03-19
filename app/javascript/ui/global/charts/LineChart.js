import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import {
  datasetPropType,
  renderTooltip,
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
      stroke: style.fill || '#000000',
      strokeWidth: 2,
      strokeDasharray: lineChartDashWithForOrder(dataset.order),
    },
  }
}

const LineChart = ({ dataset, showMeasureInTooltip, cardArea }) => {
  const { measure, timeframe } = dataset
  const values = formatValues(dataset.data)
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: dataset.max_domain,
  })
  const tooltipFn = (datum, isLastDataPoint) =>
    renderTooltip({
      datum,
      isLastDataPoint,
      timeframe,
      measure: showMeasureInTooltip ? measure : null,
    })
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
  showMeasureInTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
}

LineChart.defaultProps = {
  cardArea: 1,
  showMeasureInTooltip: false,
}

export default LineChart
