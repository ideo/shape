import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'
import v from '~/utils/variables'

import TickLabelWithTooltip from '~/ui/global/charts/TickLabelWithTooltip'
import {
  datasetPropType,
  dateTooltipText,
  advancedTooltipText,
  addDuplicateValueIfSingleValue,
  lineChartDashWithForOrder,
} from '~/ui/global/charts/ChartUtils'

export const formatValuesWithoutDates = (values, domain) => {
  const formattedValues = [...values]

  formattedValues[0].date = domain.x[0]

  // Add a duplicate value
  const duplicateValue = Object.assign({ isDuplicate: true }, values[0])
  duplicateValue.date = domain.x[1]
  formattedValues.push(duplicateValue)

  // Transform to regular arrays and objects for Victory
  return formattedValues.map(data => ({ ...data }))
}

const formatValuesWithDates = values => {
  const rawValues = addDuplicateValueIfSingleValue(values)
  // Transform to regular arrays and objects for Victory
  return rawValues.map(data => ({ ...data }))
}

const chartStyle = dataset => {
  const { style } = dataset
  return {
    data: {
      stroke: (style && style.fill) || v.colors.black,
      strokeWidth: 3,
      strokeDasharray: lineChartDashWithForOrder({
        order: dataset.order,
        scale: 1.5,
      }),
    },
  }
}

const LineChart = ({ dataset, simpleDateTooltip, cardArea, domain }) => {
  const { measure, timeframe } = dataset
  const { data } = dataset
  let values
  const dataHasDates = data[0] && !!data[0].date
  if (dataHasDates) {
    values = formatValuesWithDates(data)
  } else {
    values = formatValuesWithoutDates(data, domain)
  }
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
      style={chartStyle(dataset)}
      data={values}
      key={`dataset-${dataset.order}`}
      y="value"
      x="date"
      labelComponent={
        <TickLabelWithTooltip
          tooltipTextRenderer={tooltipFn}
          labelTextRenderer={datum => `${datum.value}`}
          cardArea={cardArea}
        />
      }
    />
  )
}

LineChart.propTypes = {
  dataset: datasetPropType.isRequired,
  simpleDateTooltip: PropTypes.bool,
  cardArea: PropTypes.number,
  domain: PropTypes.shape({
    x: PropTypes.arrayOf(PropTypes.number),
    y: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
}

LineChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
}

export default LineChart
