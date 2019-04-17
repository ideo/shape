import PropTypes from 'prop-types'
import { VictoryArea } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import {
  datasetPropType,
  chartDomainForDatasetValues,
  dateTooltipText,
  advancedTooltipText,
  addDuplicateValueIfSingleValue,
} from '~/ui/global/charts/ChartUtils'

const formatValues = rawValues => {
  const formatted = addDuplicateValueIfSingleValue(rawValues)
  return formatted.map((value, i) => ({
    ...value,
    month: value.date,
  }))
}

const chartStyle = style => {
  if (style.fill) {
    return {
      data: { fill: style.fill },
      labels: {
        fontSize: 18,
      },
    }
  }
  return {
    data: { fill: 'url(#organicGrid)' },
    labels: {
      fill: 'black',
    },
  }
}

const AreaChart = ({ dataset, simpleDateTooltip, cardArea = 1 }) => {
  const { measure, timeframe } = dataset
  const values = formatValues(dataset.data || [])
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
    <VictoryArea
      labels={d => d.value}
      labelComponent={
        <ChartTooltip textRenderer={tooltipFn} cardArea={cardArea} />
      }
      style={chartStyle(dataset.style || {})}
      data={values}
      // This makes the chart shape based on the values
      domain={domain}
      y="value"
      x="month"
    />
  )
}

AreaChart.propTypes = {
  dataset: datasetPropType.isRequired,
  simpleDateTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
}

AreaChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default AreaChart
