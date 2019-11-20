import PropTypes from 'prop-types'
import { VictoryArea } from 'victory'

import TickLabelWithTooltip from '~/ui/global/charts/TickLabelWithTooltip'
import {
  datasetPropType,
  dateTooltipText,
  advancedTooltipText,
  addDuplicateValueIfSingleValue,
} from '~/ui/global/charts/ChartUtils'

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

const formatValues = values => {
  const rawValues = addDuplicateValueIfSingleValue(values)
  // Transform to regular arrays and objects for Victory
  return rawValues
  return rawValues.map(data => ({ ...data }))
}

const AreaChart = ({ dataset, simpleDateTooltip, domain, cardArea = 1 }) => {
  const { measure, timeframe } = dataset
  const values = formatValues(dataset.data || [])
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
      style={chartStyle(dataset.style || {})}
      labels={d => d.value}
      labelComponent={
        <TickLabelWithTooltip
          tooltipTextRenderer={tooltipFn}
          labelTextRenderer={datum => `${datum.value}`}
          cardArea={cardArea}
        />
      }
      domain={domain}
      data={values}
      y="value"
      x="date"
      key={`dataset-${dataset.order}`}
    />
  )
}

AreaChart.propTypes = {
  dataset: datasetPropType.isRequired,
  simpleDateTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
  domain: PropTypes.shape({
    x: PropTypes.arrayOf(PropTypes.number),
    y: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
}

AreaChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default AreaChart
