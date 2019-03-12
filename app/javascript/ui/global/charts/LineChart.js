import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import {
  datasetPropType,
  renderTooltip,
  addDuplicateValueIfSingleValue,
  chartDomainForDatasetValues,
} from '~/ui/global/charts/ChartUtils'

const formatValues = values => {
  const formatted = addDuplicateValueIfSingleValue(values)
  return formatted.map((datum, i) => ({
    ...datum,
    x: i + 1,
    y: datum.value,
  }))
}

const chartStyle = (fill, dashWidth) => ({
  data: {
    stroke: fill || '#000000',
    strokeWidth: 2,
    strokeDasharray: dashWidth,
  },
})

const LineChart = ({ dataset, showMeasureInTooltip, cardArea, dashWidth }) => {
  const { measure, timeframe } = dataset
  const values = formatValues(dataset.data)
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: dataset.max_domain,
  })
  const tooltipMeasure = showMeasureInTooltip ? measure : null
  const tooltipFn = (datum, isLastDataPoint) =>
    renderTooltip({
      datum,
      isLastDataPoint,
      timeframe,
      measure: tooltipMeasure,
    })
  return (
    <VictoryLine
      labels={d => d.value}
      labelComponent={
        <ChartTooltip textRenderer={tooltipFn} cardArea={cardArea} />
      }
      style={chartStyle(dataset.fill, dashWidth)}
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
  dashWidth: PropTypes.number,
}

LineChart.defaultProps = {
  cardArea: 1,
  showMeasureInTooltip: false,
  dashWidth: 0,
}

export default LineChart
