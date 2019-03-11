import PropTypes from 'prop-types'
import { VictoryLine } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import { datasetPropType } from '~/ui/global/charts/ChartUtils'

class LineChart extends React.PureComponent {
  get values() {
    const { values } = this.props.dataset
    if (values) return values
    return []
  }

  get formattedValues() {
    return this.values.map((datum, i) => ({
      ...datum,
      x: i,
      y: datum.value,
    }))
  }

  get chartStyle() {
    const { fill } = this.props.dataset
    return {
      data: { stroke: fill || '#000000' },
    }
  }

  render() {
    const { tooltipRenderFn, cardArea } = this.props
    return (
      <VictoryLine
        labels={d => d.value}
        labelComponent={
          <ChartTooltip textRenderer={tooltipRenderFn} cardArea={cardArea} />
        }
        style={this.chartStyle}
        data={this.formattedValues}
      />
    )
  }
}

LineChart.propTypes = {
  dataset: datasetPropType.isRequired,
  tooltipRenderFn: PropTypes.func.isRequired,
  cardArea: PropTypes.number,
}

LineChart.defaultProps = {
  cardArea: 1,
}

export default LineChart
