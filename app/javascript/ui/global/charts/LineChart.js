import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import { datasetPropType, renderTooltip } from '~/ui/global/charts/ChartUtils'

const formatValues = values =>
  values.map((datum, i) => ({
    ...datum,
    x: i,
    y: datum.value,
  }))

const chartStyle = fill => ({
  data: { stroke: fill || '#000000' },
})

const LineChart = ({ dataset, showMeasureInTooltip, cardArea = 1 }) => {
  const { measure, timeframe } = dataset
  const values = formatValues(dataset.data)
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
      style={chartStyle(dataset.fill)}
      data={values}
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
