import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Flyout, VictoryTooltip } from 'victory'

import { ChartTooltip } from './ChartLabelWithTooltip'
import v from '~/utils/variables'

const DotFlyout = props => (
  <g>
    <Flyout {...props} />
    <circle
      cx={props.x}
      cy={props.y + 9}
      r="4"
      stroke={v.colors.white}
      strokeWidth={0.5}
      fill={v.colors.black}
    />
  </g>
)

class TickLabelWithTooltip extends React.PureComponent {
  static defaultEvents = VictoryTooltip.defaultEvents

  get maxValue() {
    const { data } = this.props
    return Math.max(...data.map(d => d.value))
  }

  get minValue() {
    const { data } = this.props
    return Math.min(...data.map(d => d.value))
  }

  get isLastDataPoint() {
    const { data, index } = this.props
    return parseInt(index) === data.length - 1
  }

  isFirstPointOfType(typeAmount) {
    const { data, index } = this.props
    const all = data.filter(d => d.value === typeAmount)

    if (!all.length) return false
    const firstIdx = all[0]._x - 1
    return parseInt(index) === firstIdx
  }

  get isFirstMaxPoint() {
    return this.isFirstPointOfType(this.maxValue)
  }

  get isFirstMinPoint() {
    return this.isFirstPointOfType(this.minValue)
  }

  get xOffset() {
    const { cardArea, x } = this.props
    // Right now data cards can only be 2x2 or 1x1
    const cardWidth = cardArea === 4 ? 2 : 1
    // The point when the tooltip should be moved over from the left side
    // of the chart. Value is set by what visually works
    const lowerThreshold = 25
    //  A general average of the radius of the tooltip that works across
    //  all the charts
    const avgTooltipRadius = 10
    // Ratio is the general amount between x's to move them toward center
    // The smaller charts need to be pushed over more, hence the smaller ratio
    const ratio = cardArea === 1 ? 0.1 : 6
    if (x < lowerThreshold) {
      return avgTooltipRadius - x + 1 / ratio
    }
    // The point when the tooltip should be moved over from the right side
    // of the chart. Value is set by what visually works
    const upperThreshold = 100
    const pxWidth = 175 * cardWidth
    if (x >= pxWidth + upperThreshold) {
      const relativeRadius = avgTooltipRadius / (cardWidth / 2)
      return -relativeRadius
    }
    return 0
  }

  get fontSizes() {
    const { cardArea } = this.props
    if (cardArea === 1) {
      return {
        tooltip: '20px',
        label: '20px',
      }
    }
    return {
      tooltip: '10px',
      label: '10px',
    }
  }

  get isTwoDuplicatePoints() {
    const { data } = this.props
    if (data.length !== 2) return false

    return data[0].value === data[1].value
  }

  renderValueMark(datum, totalData) {
    if (this.isFirstMaxPoint && !this.isTwoDuplicatePoints) return true
    if (this.isFirstMinPoint && !this.isTwoDuplicatePoints) return true
    if (this.isLastDataPoint) return true
    return false
  }

  render() {
    const {
      alwaysShowLabels,
      cardArea,
      data,
      datum,
      displayTicks,
      labelTextRenderer,
      tooltipTextRenderer,
      x,
      y,
    } = this.props
    const showAlways =
      alwaysShowLabels || this.renderValueMark(datum, data.length - 1)
    const dx = this.xOffset
    const labelText = labelTextRenderer(datum, this.isLastDataPoint)
    const tooltipText = tooltipTextRenderer(datum, this.isLastDataPoint)
    return (
      <g>
        <ChartTooltip
          {...this.props}
          cornerRadius={cardArea === 1 ? 4 : 2}
          flyoutComponent={displayTicks ? <DotFlyout /> : <Flyout />}
          dx={dx * 5}
          dy={0}
          text={tooltipText}
        />
        {showAlways && (
          <Fragment>
            <VictoryTooltip
              active={showAlways}
              {...this.props}
              dx={dx}
              dy={-20}
              style={{ fontSize: this.fontSizes.label, fontWeight: 'normal' }}
              text={labelText}
              flyoutStyle={{ stroke: 'transparent', fill: 'transparent' }}
            />
            {displayTicks && (
              <line
                x1={x}
                x2={x + 8}
                y1={y + 9}
                y2={y + 9}
                dx={dx}
                stroke="black"
                strokeWidth={0.75}
              />
            )}
          </Fragment>
        )}
      </g>
    )
  }
}
TickLabelWithTooltip.propTypes = {
  tooltipTextRenderer: PropTypes.func.isRequired,
  labelTextRenderer: PropTypes.func.isRequired,
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  cardArea: PropTypes.number,
  displayTicks: PropTypes.bool,
  alwaysShowLabels: PropTypes.bool,
  fontSize: PropTypes.number,
}
TickLabelWithTooltip.defaultProps = {
  maxValue: 0,
  minValue: 0,
  cardArea: 1,
  displayTicks: true,
  alwaysShowLabels: false,
  fontSize: 18,
}

export default TickLabelWithTooltip
