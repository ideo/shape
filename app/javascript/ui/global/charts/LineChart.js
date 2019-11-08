import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'
import v from '~/utils/variables'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import {
  datasetPropType,
  dateTooltipText,
  advancedTooltipText,
  addDuplicateValueIfSingleValue,
  chartDomainForDatasetValues,
  lineChartDashWithForOrder,
} from '~/ui/global/charts/ChartUtils'

export const formatValuesWithoutDates = (values, numDesiredValues) => {
  const formattedValues = [...values]

  // Add a duplicate value
  for (let i = formattedValues.length; i < numDesiredValues; i++) {
    const duplicateValue = Object.assign({ isDuplicate: true }, values[0])
    formattedValues.push(duplicateValue)
  }

  // Add x to show it in the right placement
  return formattedValues.map((datum, i) => ({
    ...datum,
    x: i + 1,
  }))
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

const LineChart = ({
  dataset,
  simpleDateTooltip,
  cardArea,
  numPrimaryDatasetValues,
}) => {
  const { measure, timeframe } = dataset
  const { data } = dataset
  let values
  const dataHasDates = data[0] && data[0].date
  if (dataHasDates) {
    values = formatValuesWithDates(data)
  } else {
    values = formatValuesWithoutDates(data, numPrimaryDatasetValues)
  }
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

  const props = {
    labels: d => d.value,
    style: chartStyle(dataset),
    data: values,
    domain: domain,
    key: `dataset-${dataset.order}`,
    y: 'value',
  }

  if (dataHasDates) props.x = 'date'

  return (
    <VictoryLine
      {...props}
      labelComponent={
        <ChartTooltip
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
  numPrimaryDatasetValues: PropTypes.number,
}

LineChart.defaultProps = {
  cardArea: 1,
  simpleDateTooltip: false,
  numPrimaryDatasetValues: 0,
}

export default LineChart
