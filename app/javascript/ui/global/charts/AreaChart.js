import PropTypes from 'prop-types'
import { VictoryArea } from 'victory'

import TickLabelWithTooltip from '~/ui/global/charts/TickLabelWithTooltip'
import {
  datasetPropType,
  dateTooltipText,
  advancedTooltipText,
  domainProps,
  formatValuesForVictory,
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

const AreaChart = ({
  dataset,
  order,
  simpleDateTooltip,
  domain,
  cardArea = 1,
}) => {
  const { measure, timeframe, dataWithDates } = dataset
  // Add dates to data if there are none
  const values = formatValuesForVictory({
    values: dataWithDates || [],
    addStartDate: dataWithDates[0].date ? null : domain.x[0],
    addEndDate: dataWithDates[0].date ? null : domain.x[1],
  })
  let tooltipFn
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
    <VictoryArea
      style={chartStyle(dataset.style || {})}
      labels={d => d.value}
      labelComponent={
        <TickLabelWithTooltip
          tooltipTextRenderer={tooltipFn}
          labelTextRenderer={datum => `${datum.value}`}
          cardArea={cardArea}
          fontSize={cardArea === 1 ? 18 : 9}
        />
      }
      domain={domain}
      data={values}
      y="value"
      x="date"
      key={`dataset-${order}`}
    />
  )
}

AreaChart.propTypes = {
  dataset: datasetPropType.isRequired,
  order: PropTypes.number.isRequired,
  simpleDateTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
  domain: domainProps.isRequired,
}

AreaChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default AreaChart
