import PropTypes from 'prop-types'
import moment from 'moment-mini'

import { LineSegment, VictoryLabel } from 'victory'

import monthEdge from '~/utils/monthEdge'
import { utcMoment, domainProps } from '~/ui/global/charts/ChartUtils'
import v from '~/utils/variables'

const tickLabelStyle = isSmallChartStyle => {
  if (isSmallChartStyle) {
    return {
      fontSize: '18px',
      dy: -5,
    }
  } else {
    return {
      fontSize: '10px',
      dy: 5,
    }
  }
}

const chartAxisStyle = isSmallChartStyle => {
  if (isSmallChartStyle) {
    return {
      axis: {
        stroke: v.colors.commonMedium,
        strokeWidth: 45,
        transform: 'translateY(26px)',
      },
      axisLabel: {
        padding: 0,
        fontSize: '18px',
        dy: -5,
      },
    }
  }
  return {
    axis: {
      stroke: v.colors.commonMedium,
      strokeWidth: 25,
      strokeLinecap: 'square',
      transform: 'translateY(22px)',
    },
  }
}

const calculateRelativeWidth = label => {
  const modifier = label.isSmallChartStyle ? 11 : 8
  return label.text.length * modifier
}

const calculateDx = (x, w, isSmallChartStyle) => {
  if (isSmallChartStyle) {
    if (x === 0) return w
    if (x - w < 1) return w - x
  }
  return 0
}

const TickLabel = props => {
  const w = calculateRelativeWidth(props)
  const dx = calculateDx(props.x, w, props.isSmallChartStyle)
  let dy = props.dy || 5

  const updatedStyle = Object.assign({}, props.style, {
    fontSize: props.fontSize,
  })

  if (props.text === '|') dy = -25

  const Label = (
    <VictoryLabel
      {...props}
      textAnchor="end"
      dx={dx}
      dy={dy}
      style={updatedStyle}
    />
  )

  return Label
}

const fullDate = (date, index) => {
  const momentDate = utcMoment(date)
  return `Q${momentDate.quarter()} ${momentDate.year()}`
}

const isDataYearOld = datasetValues =>
  moment().diff(moment(datasetValues[0].date), 'years') > 0

export const monthlyXAxisText = (
  datasetValues,
  datasetTimeframe,
  date,
  index
) => {
  const dateOperand = utcMoment(date)
  const dateNearMonthEdge = monthEdge(dateOperand, datasetTimeframe)

  if (dateNearMonthEdge) {
    const datesNearOperandAndMonthEdge = datasetValues.filter(val => {
      const dateIteratee = utcMoment(val.date)
      const valueNearMonthEdge = monthEdge(dateIteratee, datasetTimeframe)

      if (!valueNearMonthEdge) return false

      return Math.abs(dateIteratee.diff(dateOperand, 'days')) < 8
    })

    if (datesNearOperandAndMonthEdge.length > 1) {
      const allDates = datasetValues.map(val => val.date)
      // Don't show date being operated on if it is not last one
      // This is to avoid date labels piling up on top of each other
      if (index < allDates.length - 1) return ''
    }

    let format = 'MMM'
    // If this chart has over a year of data, show the year
    if (isDataYearOld(datasetValues)) {
      format += ' YYYY'
    }
    return `${dateNearMonthEdge.format(format)}`
  }
  // Don't show the label if it's not within a certain month range
  return ''
}

const ChartAxisProps = ({
  datasetValues,
  datasetTimeframe,
  domain,
  isSmallChartStyle,
  dateValues,
  itemId,
}) => {
  // NOTE: The transform property is for IE11 which doesn't recognize CSS
  // transform properties on SVG
  let tickCount = Math.min(datasetValues.length, 12)
  if (isSmallChartStyle) {
    tickCount = 5
  } else {
    // There's less room when we also render the year in the tick labels
    if (isDataYearOld(datasetValues)) tickCount = 8
  }
  const axisProps = {
    dependentAxis: false,
    domain,
    style: chartAxisStyle(isSmallChartStyle),
    offsetY: isSmallChartStyle ? 13 : 22,
    axisComponent: <LineSegment transform="translate(10 26) scale(0.955)" />,
    tickCount,
  }

  if (dateValues) {
    axisProps.tickValues = dateValues
    axisProps.tickCount = null
  }
  const datasetXAxisText = (date, index) => {
    return monthlyXAxisText(datasetValues, datasetTimeframe, date, index)
  }

  const tickLabelStyleProps = tickLabelStyle(isSmallChartStyle)
  return datasetValues.length > 1
    ? {
        ...axisProps,
        tickFormat: isSmallChartStyle ? fullDate : datasetXAxisText,
        tickLabelComponent: (
          <TickLabel
            fontSize={tickLabelStyleProps.fontSize}
            dy={tickLabelStyleProps.dy}
            isSmallChartStyle={isSmallChartStyle}
            itemId={itemId}
          />
        ),
        orientation: 'bottom',
        axisComponent: (
          <LineSegment transform="translate(10 26) scale(0.955)" />
        ),
      }
    : {
        ...axisProps,
        tickFormat: t => null,
        axisLabelComponent: (
          <TickLabel fontSize={tickLabelStyleProps.fontSize} />
        ),
        style: chartAxisStyle(isSmallChartStyle),
        label: fullDate(datasetValues[0].date),
      }
}

ChartAxisProps.propTypes = {
  datasetValues: PropTypes.arrayOf(PropTypes.object).isRequired,
  datasetTimeframe: PropTypes.string.isRequired,
  domain: domainProps.isRequired,
  isSmallChartStyle: PropTypes.bool.isRequired,
}

export default ChartAxisProps
