import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import moment from 'moment-mini'
import styled from 'styled-components'
import pluralize from 'pluralize'

import v from '~/utils/variables'

export const utcMoment = date => moment(`${date} 00+0000`).utc()

export const datasetPropType = PropTypes.shape({
  measure: PropTypes.string.isRequired,
  description: PropTypes.string,
  chart_type: PropTypes.string.isRequired,
  timeframe: PropTypes.string.isRequired,
  primary: PropTypes.bool.isRequired,
  fill: PropTypes.string,
  max_domain: PropTypes.number,
  single_value: PropTypes.number,
  data: MobxPropTypes.arrayOrObservableArrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
    })
  ),
})

export const primaryFillColorFromDatasets = datasets => {
  if (!datasets) return '#000000'
  const primary = datasets.filter(dataset => dataset.primary)
  return primary ? primary.chartFill : '#000000'
}

export const maxDomainForDataset = dataset => {
  if (dataset.max_domain) return dataset.max_domain
  const values = dataset.data.map(datum => datum.value)
  return Math.max(...values)
}

export const chartDomainForValues = (dataset, maxDomain) => ({
  x: [1, this.formattedValues.length],
  y: [0, maxDomain],
})

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
  let text = datum.value
  if (measure) {
    text += ` ${pluralize(measure)}\n`
  }
  text += isLastDataPoint ? `in last ${dayTimeframe}` : timeRange
  return text
}

export const AboveChartContainer = styled.div`
  position: absolute;
  z-index: ${v.zIndex.aboveVictoryChart};
`
