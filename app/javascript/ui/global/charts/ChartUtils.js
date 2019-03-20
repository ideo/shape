import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import moment from 'moment-mini'
import styled from 'styled-components'
import pluralize from 'pluralize'

import v from '~/utils/variables'

export const lineChartDashWithForOrder = ({ order, scale = 1 }) => {
  const dashWidths = [[2, 4], [3, 1], [4, 2], [2, 8], [8, 6], [1, 5]]
  const values = dashWidths[order - 1] ? dashWidths[order - 1] : dashWidths[0]
  return values.map(val => val * scale).join(',')
}

export const utcMoment = date => moment(`${date} 00+0000`).utc()

export const datasetPropType = PropTypes.shape({
  measure: PropTypes.string.isRequired,
  description: PropTypes.string,
  chart_type: PropTypes.string.isRequired,
  timeframe: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
  max_domain: PropTypes.number,
  style: PropTypes.shape({
    fill: PropTypes.string,
    dashWidth: PropTypes.number,
  }),
  single_value: PropTypes.number,
  data: MobxPropTypes.arrayOrObservableArrayOf(
    PropTypes.shape({
      value: PropTypes.number,
      date: PropTypes.string,
    })
  ),
})

export const primaryFillColorFromDataset = dataset => {
  if (!dataset) return '#000000'
  return dataset.style && dataset.style.fill ? dataset.style.fill : '#000000'
}

export const chartDomainForDatasetValues = ({ values, maxDomain }) => {
  let domain
  if (maxDomain) {
    domain = maxDomain
  } else {
    const vals = values.map(datum => datum.value)
    domain = Math.max(...vals)
  }
  return {
    x: [1, values.length],
    y: [0, domain],
  }
}

export const renderTooltip = ({
  datum,
  isLastDataPoint,
  timeframe,
  measure,
}) => {
  const momentDate = utcMoment(datum.date)
  let timeRange = `${momentDate
    .clone()
    .subtract(1, timeframe)
    .format('MMM D')} - ${momentDate.format('MMM D')}`

  let dayTimeframe = '7 days'
  if (timeframe === 'month') {
    timeRange = `in ${momentDate
      .clone()
      .subtract(1, 'month')
      .format('MMMM')}`
    dayTimeframe = '30 days'
  }
  if (timeframe === 'day') {
    timeRange = `on ${momentDate.format('MMM D')}`
  }
  let text = `${datum.value} `
  if (measure) {
    text += `${pluralize(measure)}\n`
  }
  text += isLastDataPoint ? `in last ${dayTimeframe}` : timeRange
  return text
}

export const addDuplicateValueIfSingleValue = values => {
  if (values.length === 0 || values.length > 1) return values

  // Copy array so we can modify it
  const valuesWithDupe = [...values]

  // Add a duplicate value
  const duplicateValue = Object.assign({ isDuplicate: true }, valuesWithDupe[0])
  // Set date to 3 months ago
  if (duplicateValue.date) {
    duplicateValue.date = utcMoment(duplicateValue.date)
      .subtract('3', 'months')
      .format('YYYY-MM-DD')
    if (duplicateValue.month) duplicateValue.month = duplicateValue.date
  }
  valuesWithDupe.unshift(duplicateValue)
  return valuesWithDupe
}

export const AboveChartContainer = styled.div`
  position: absolute;
  z-index: ${v.zIndex.aboveVictoryChart};
`
