import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Flyout, VictoryTooltip } from 'victory'

import v from '~/utils/variables'
import { theme } from '~/ui/test_collections/shared'

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

class ChartTooltip extends React.PureComponent {
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
    const { x } = this.props
    // Ratio is the general amount between x's to move them toward center
    const ratio = 6
    if (x < 52) {
      return 14 - x / ratio
    }
    if (x > 398) {
      const diff = 450 - x
      return -(14 - diff / ratio)
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
      tooltip: '12px',
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
    const { data, datum, textRenderer, x, y } = this.props
    const showAlways = this.renderValueMark(datum, data.length - 1)
    const dx = this.xOffset
    const text = textRenderer(datum, this.isLastDataPoint)
    return (
      <g>
        <VictoryTooltip
          {...this.props}
          theme={theme}
          cornerRadius={2}
          flyoutComponent={<DotFlyout />}
          height={40}
          width={180}
          dx={dx * 5}
          dy={0}
          style={{
            fill: 'white',
            fontFamily: v.fonts.sans,
            fontSize: this.fontSizes.tooltip,
            fontWeight: 'normal',
          }}
          text={text}
          orientation="top"
          pointerLength={0}
          flyoutStyle={{
            transform: 'translateY(-5px)',
            stroke: 'transparent',
            fill: v.colors.black,
            opacity: 0.8,
          }}
        />
        {showAlways && (
          <Fragment>
            <VictoryTooltip
              active={showAlways}
              {...this.props}
              dx={dx}
              dy={-5}
              style={{ fontSize: this.fontSizes.label, fontWeight: 'normal' }}
              text={`${datum.value}`}
              orientation="top"
              pointerLength={0}
              flyoutStyle={{ stroke: 'transparent', fill: 'transparent' }}
            />
            <line
              x1={x}
              x2={x + 8}
              y1={y + 9}
              y2={y + 9}
              dx={dx}
              stroke="black"
              strokeWidth={0.75}
            />
          </Fragment>
        )}
      </g>
    )
  }
}
ChartTooltip.propTypes = {
  textRenderer: PropTypes.func.isRequired,
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  cardArea: PropTypes.number,
}
ChartTooltip.defaultProps = {
  maxValue: 0,
  minValue: 0,
  cardArea: 1,
}

export default ChartTooltip
