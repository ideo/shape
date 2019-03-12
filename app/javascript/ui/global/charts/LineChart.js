import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import { datasetPropType } from '~/ui/global/charts/ChartUtils'

const formatValues = values =>
  values.map((datum, i) => ({
    ...datum,
    x: i,
    y: datum.value,
  }))

const chartStyle = fill => ({
  data: { stroke: fill || '#000000' },
})

const LineChart = ({ dataset, tooltipRenderFn, cardArea = 1 }) => {
  const values = formatValues(dataset.data)
  const tooltipFn = tooltipRenderFn || (datum => datum.value)
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
  tooltipRenderFn: PropTypes.func.isRequired,
  cardArea: PropTypes.number,
}

LineChart.defaultProps = {
  cardArea: 1,
}

export default LineChart
