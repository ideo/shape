import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import moment from 'moment-mini'
import styled from 'styled-components'
import pluralize from 'pluralize'
import { VictoryTheme } from 'victory'
import objectAssignDeep from '~/vendor/object-assign-deep'

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

export const emojiTooltipText = datum => `${datum.value}`

export const dateTooltipText = datum =>
  `${datum.value} on ${utcMoment(datum.date).format('l')}`

export const advancedTooltipText = ({
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

export const colorScale = [
  v.colors.tertiaryMedium,
  v.colors.primaryLight,
  '#738091',
  '#A1A6B4',
  '#88B6C6',
  '#5473A6',
  '#929E9E',
  '#84AF99',
  '#C2BBB9',
  '#8B83A2',
  '#AE8CA3',
  '#D6C3C9',
  '#DEA895',
  '#A85751',
  '#454545',
]

export const themeLabelStyles = {
  fontFamily: v.fonts.sans,
  fontSize: '10px',
  padding: 10,
  fill: v.colors.black,
  stroke: 'transparent',
  textTransform: 'uppercase',
}

export const victoryTheme = objectAssignDeep({}, VictoryTheme.grayscale, {
  bar: {
    style: {
      data: {
        fill: colorScale[0],
      },
      labels: Object.assign({}, themeLabelStyles, {
        fill: v.colors.black,
        fontSize: 8,
      }),
    },
    colorScale,
  },
  area: {
    style: {
      labels: Object.assign({}, themeLabelStyles, {
        fill: v.colors.tertiaryMedium,
      }),
    },
  },
  axis: {
    style: {
      tickLabels: themeLabelStyles,
      axisLabel: themeLabelStyles,
    },
  },
  group: {
    colorScale,
  },
  legend: {
    colorScale,
    fontSize: 14,
    gutter: 10,
    style: {
      data: {
        type: 'square',
      },
      labels: Object.assign({}, themeLabelStyles, {
        fontSize: 10.5,
      }),
      border: {
        fill: 'rgba(255, 255, 255, 0.5)',
      },
      title: themeLabelStyles,
    },
  },
})

export const emojiSeries = {
  question_useful: [
    { number: 1, name: 'Very useless', symbol: '👎' },
    { number: 2, name: 'Somewhat useless', scale: 0.6, symbol: '👎' },
    { number: 3, name: 'Somewhat useful', scale: 0.6, symbol: '👍' },
    { number: 4, name: 'Very useful', symbol: '👍' },
  ],
  question_category_satisfaction: [
    { number: 1, name: 'Very unsatisfied', symbol: '😡' },
    { number: 2, name: 'Somewhat unsatisfied', scale: 0.6, symbol: '☹️' },
    { number: 3, name: 'Mostly Satisfied', scale: 0.6, symbol: '😊' },
    { number: 4, name: 'Very satisfied', symbol: '😍' },
  ],
  question_clarity: [
    { number: 1, name: 'Totally unclear', symbol: '🤷‍♀️' },
    { number: 2, name: 'Somewhat unclear', scale: 0.6, symbol: '🕶' },
    { number: 3, name: 'Mostly clear', scale: 0.6, symbol: '👓' },
    { number: 4, name: 'Totally clear', symbol: '🔬' },
  ],
  question_excitement: [
    { number: 1, name: 'Totally unexciting', symbol: '😴' },
    { number: 2, name: 'Unexciting', scale: 0.6, symbol: '😔' },
    { number: 3, name: 'Exciting', scale: 0.6, symbol: '🙂' },
    { number: 4, name: 'Totally exciting', symbol: '😍' },
  ],
  question_different: [
    { number: 1, name: 'Not at all different', symbol: '😏' },
    { number: 2, name: 'Not very different', scale: 0.6, symbol: '😐' },
    { number: 3, name: 'Different', scale: 0.6, symbol: '😲' },
    { number: 4, name: 'Very different', symbol: '🤯' },
  ],
}

export const emojiSeriesForQuestionType = questionType => {
  const series = emojiSeries[questionType]
  if (series) return series
  return emojiSeries.question_category_satisfaction
}
