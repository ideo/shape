import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { LineSegment, VictoryAxis, VictoryLabel } from 'victory'

import monthEdge from '~/utils/monthEdge'
import { utcMoment } from '~/ui/global/charts/ChartUtils'
import v from '~/utils/variables'

const tickLabelStyle = isSmallChartStyle => {
  if (this.isSmallChartStyle) {
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
        strokeWidth: 30,
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

const calculateTickLabelEdges = labelText => {
  if (!labelText) return 0

  return labelText.length * 5.5
}

const TickLabel = props => {
  let dx

  if (props.x === 0) dx = calculateTickLabelEdges(props.text)
  if (props.x === 450) dx = -calculateTickLabelEdges(props.text)
  const updatedStyle = Object.assign({}, props.style, {
    fontSize: props.fontSize,
  })
  return (
    <VictoryLabel {...props} dx={dx} dy={props.dy || 5} style={updatedStyle} />
  )
}

const fullDate = (date, index) => `${utcMoment(date).format('MM/DD/YY')}`

const monthlyXAxisText = (
  datasetValues,
  datasetTimeframe,
  primary,
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

    return `${dateNearMonthEdge.format('MMM')}`
  }
  // Don't show the label if it's not within a certain month range
  return ''
}

const ChartAxis = ({
  datasetValues,
  datasetTimeframe,
  domain,
  isSmallChartStyle,
}) => {
  // NOTE: The transform property is for IE11 which doesn't recognize CSS
  // transform properties on SVG

  const axisProps = {
    dependentAxis: false,
    domain: domain,
    style: chartAxisStyle(isSmallChartStyle),
    offsetY: 13,
    axisComponent: <LineSegment transform="translate(10 26) scale(0.955)" />,
  }

  const datasetXAxisText = (primary, date, index) => {
    return monthlyXAxisText(
      datasetValues,
      datasetTimeframe,
      primary,
      date,
      index
    )
  }

  return datasetValues.length > 1 ? (
    <VictoryAxis
      {...axisProps}
      tickFormat={isSmallChartStyle ? fullDate : datasetXAxisText}
      tickLabelComponent={
        <TickLabel fontSize={tickLabelStyle.fontSize} dy={tickLabelStyle.dy} />
      }
      orientation="bottom"
      axisComponent={<LineSegment transform="translate(10 26) scale(0.955)" />}
    />
  ) : (
    <VictoryAxis
      {...axisProps}
      tickFormat={t => null}
      axisLabelComponent={<TickLabel fontSize={tickLabelStyle.fontSize} />}
      style={chartAxisStyle(isSmallChartStyle)}
      label={fullDate(datasetValues[0].date)}
    />
  )
}

ChartAxis.propTypes = {
  datasetValues: MobxPropTypes.objectOrObservableObject.isRequired,
  datasetTimeframe: PropTypes.string.isRequired,
  domain: PropTypes.shape({
    x: PropTypes.arrayOf(PropTypes.number),
    y: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  isSmallChartStyle: PropTypes.bool.isRequired,
}

export default ChartAxis
