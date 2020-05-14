import PropTypes from 'prop-types'
import color from 'color'
import { maxBy, minBy } from 'lodash'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import moment from 'moment-mini'
import styled from 'styled-components'
import pluralize from 'pluralize'
import { VictoryTheme } from 'victory'
import objectAssignDeep from '~/vendor/object-assign-deep'

import v from '~/utils/variables'

export const barWidthPx = (totalColumns, totalGroupings) => {
  const padding = 16
  const maxWidth = 644
  const totalBars = totalColumns * totalGroupings
  const widthModifier = maxWidth / totalBars
  const width = Math.min(widthModifier - padding, 28)
  return width
}

// 30 / (5 / 1 / 2)

export const lineChartDashWithForOrder = ({ order, scale = 1 }) => {
  const dashWidths = [[2, 4], [3, 1], [4, 2], [2, 8], [8, 6], [1, 5]]
  const values = dashWidths[order - 1] ? dashWidths[order - 1] : dashWidths[0]
  return values.map(val => val * scale).join(',')
}

export const utcMoment = date => {
  if (typeof date === 'object') {
    return moment(date.toUTCString()).utc()
  } else {
    return moment(`${date} 00+0000`).utc()
  }
}

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

export const domainXForSingleValue = date => {
  return [
    moment(date)
      .subtract('months', 1)
      .toDate(),
    moment(date)
      .add('months', 1)
      .toDate(),
  ]
}

export const chartDomainForDatasetValues = ({ values, maxYDomain }) => {
  if (values.length === 0) {
    return {
      x: [0, 0],
      y: [0, 0],
    }
  }

  let minXDomain
  let maxXDomain
  let calculatedMaxYDomain

  if (maxYDomain && maxYDomain > maxBy(values, 'value').value) {
    calculatedMaxYDomain = maxYDomain
  } else {
    calculatedMaxYDomain = maxBy(values, 'value').value
  }

  const numValuesWithDates = values.filter(datum => !!datum.date).length

  if (numValuesWithDates > 0) {
    minXDomain = minBy(values, 'date').date
    maxXDomain = maxBy(values, 'date').date
  } else {
    minXDomain = 1
    maxXDomain = values.length
  }
  return {
    x: [minXDomain, maxXDomain],
    y: [0, calculatedMaxYDomain],
  }
}

export const domainProps = PropTypes.shape({
  x: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ])
  ),
  y: PropTypes.arrayOf(PropTypes.number),
})

export const emojiTooltipText = datum => `${datum.value}`

export const tierTooltipLabel = ({ tiers, datum, dataset }) => {
  if (!datum.date) return datum.value
  const { value } = datum
  let currentTier = 0
  tiers.forEach(tier => {
    if (value >= tier.value) currentTier = tier
  })
  let nextTier = tiers[tiers.length - 1]
  let isFinalTier = false
  const currentTierIdx = tiers.indexOf(currentTier)
  if (currentTierIdx !== tiers.length - 1) {
    nextTier = tiers[currentTierIdx + 1]
  } else {
    isFinalTier = true
  }

  return `${currentTier.name}\n${dataset.name}${
    isFinalTier
      ? ''
      : `\n${nextTier.value - datum.value}pts away from ${nextTier.name}`
  }\n${utcMoment(datum.date).format('MMM YYYY')} | ${datum.value}/100`
}

export const dateTooltipText = (datum, datasetName = null) => {
  if (!datum.date) return datum.value
  const text = `${datum.value} on ${utcMoment(datum.date).format('l')}`
  if (!datasetName) return text
  return `${datasetName}\n${text}`
}

export const darkenColor = (fill, multiplier) =>
  color(fill)
    .darken(0.18 * multiplier)
    .string()

export const advancedTooltipText = ({
  datum,
  isLastDataPoint,
  timeframe,
  measure,
}) => {
  const momentDate = utcMoment(datum.date)
  // for example when we say May 1:
  // timeframe 'week' = 'Apr 24 - Apr 30' (the week leading up to May 1)
  // timerame 'month' = 'in April' (all of April leading up to May 1)
  const timeframeBegin = momentDate.clone().subtract(1, timeframe)
  const timeframeEnd = momentDate.clone().subtract(1, 'day')
  let timeRange = `${timeframeBegin.format('MMM D')} - ${timeframeEnd.format(
    'MMM D'
  )}`

  let dayTimeframe = '7 days'
  if (timeframe === 'month') {
    timeRange = `in ${timeframeBegin.clone().format('MMMM')}`
    dayTimeframe = '30 days'
  }
  if (timeframe === 'day') {
    timeRange = `on ${timeframeBegin.format('MMM D')}`
  }
  let text = `${datum.value.toLocaleString()} `
  if (measure) {
    text += `${pluralize(measure)}\n`
  }
  text += isLastDataPoint ? `in last ${dayTimeframe}` : timeRange
  return text
}

export const addDuplicateValueIfSingleValue = (
  values,
  addStartDate,
  addEndDate
) => {
  if (values.length === 0 || values.length > 1) return values

  // Copy array so we can modify it
  const valuesWithDupe = [...values]

  if (!valuesWithDupe[0].date && addStartDate)
    valuesWithDupe[0].date = addStartDate

  // Add a duplicate value
  const duplicateValue = { ...valuesWithDupe[0], isDuplicate: true }
  // Set given date
  if (duplicateValue.date && addEndDate) {
    duplicateValue.date = addEndDate
    if (duplicateValue.month) duplicateValue.month = duplicateValue.date
  }
  valuesWithDupe.push(duplicateValue)
  return valuesWithDupe
}

export const formatValuesForVictory = ({
  values,
  addStartDate,
  addEndDate,
}) => {
  // Victory doesn't support single dta points, so duplicate if we have only one
  const rawValues = addDuplicateValueIfSingleValue(
    values,
    addStartDate,
    addEndDate
  )

  // Transform to regular arrays and objects for Victory
  return rawValues.map(data => ({ ...data }))
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
    { number: 1, name: 'Not at all useful', symbol: '👎' },
    { number: 2, name: 'Not very useful', scale: 0.6, symbol: '👎' },
    { number: 3, name: 'Somewhat useful', scale: 0.6, symbol: '👍' },
    { number: 4, name: 'Very useful', symbol: '👍' },
  ],
  question_category_satisfaction: [
    { number: 1, name: 'Very unsatisfied', symbol: '😡' },
    { number: 2, name: 'Somewhat unsatisfied', scale: 0.6, symbol: '🙁' },
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
