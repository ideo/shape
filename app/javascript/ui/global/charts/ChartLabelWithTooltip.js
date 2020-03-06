import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { VictoryLabel, VictoryTooltip } from 'victory'
import { max } from 'lodash'

import v from '~/utils/variables'
import { victoryTheme } from '~/ui/global/charts/ChartUtils'

export const ChartTooltip = props => {
  const orientationHandler = _orientationProps => {
    const { domain } = props
    const maxYDomain = max(domain.y)
    const { _y } = _orientationProps
    if (_y === 0) return 'top'

    const percentage = (_y / maxYDomain) * 100
    if (percentage > 50) return 'bottom'
    return 'top'
  }
  return (
    <VictoryTooltip
      {...props}
      dy={props.dy}
      cornerRadius={props.cornerRadius}
      text={props.text}
      active={props.active}
      orientation={orientationHandler}
      theme={victoryTheme}
      flyoutHeight={350}
      style={{
        fill: 'white',
        fontFamily: v.fonts.sans,
        fontSize: props.fontSize || 10,
        fontWeight: 'normal',
        padding: 16,
      }}
      pointerLength={0}
      flyoutStyle={{
        stroke: 'transparent',
        fill: v.colors.black,
        opacity: 0.8,
      }}
    />
  )
}

class ChartLabelWithTooltip extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tooltipOn: false,
    }
  }

  toggleHover = ev => {
    this.setState({
      tooltipOn: !this.state.tooltipOn,
    })
  }

  render() {
    const { props } = this
    const { maxTickLength, text, totalColumns } = props
    const truncatedText =
      text.length > maxTickLength
        ? `${text.substring(0, maxTickLength)} …`
        : text
    // Nudge the lables over to the right or left if first or last in chart
    let dx = 0
    if (props.index === 0) dx = 7
    if (props.index === totalColumns - 1) dx = -7
    return (
      <Fragment>
        <VictoryLabel
          {...props}
          events={{
            onMouseEnter: this.toggleHover,
            onMouseLeave: this.toggleHover,
          }}
          dx={dx}
          text={truncatedText}
        />
        <ChartTooltip
          {...props}
          cornerRadius={2}
          dy={15}
          text={props.text}
          active={this.state.tooltipOn}
          fontSize={8}
        />
      </Fragment>
    )
  }
}
ChartLabelWithTooltip.propTypes = {
  text: PropTypes.string,
  maxTickLength: PropTypes.number,
}
ChartLabelWithTooltip.defaultProps = {
  text: '',
  maxTickLength: Infinity,
}

export default ChartLabelWithTooltip
