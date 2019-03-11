import PropTypes from 'prop-types'
import { VictoryArea } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import { datasetPropType, utcMoment } from '~/ui/global/charts/ChartUtils'

class AreaChart extends React.PureComponent {
  get values() {
    const { values } = this.props.dataset
    if (values) return values
    return []
  }

  get formattedValues() {
    const mappedValues = this.values.map((value, i) => ({
      ...value,
      month: value.date,
    }))

    // We need to add a duplicate value if there is only 1 value,
    // to properly display an area chart
    if (mappedValues.length === 1) {
      const duplicateValue = Object.assign({}, this.primaryValues[0])
      duplicateValue.date = utcMoment(duplicateValue.date)
        .subtract('3', 'months')
        .format('YYYY-MM-DD')
      duplicateValue.month = duplicateValue.date
      duplicateValue.isDuplicate = true
      mappedValues.push(duplicateValue)
    }

    return mappedValues
  }

  get chartStyle() {
    const { fill } = this.props.dataset
    if (fill) {
      return {
        data: { fill },
        labels: {
          fontSize: 18,
        },
      }
    }
    return {
      data: { fill: 'url(#organicGrid)' },
      labels: {
        fill: 'black',
      },
    }
  }

  get chartDomain() {
    return { x: [1, this.formattedValues.length], y: [0, this.maxDomain] }
  }

  render() {
    const { tooltipRenderFn, cardArea } = this.props

    return (
      <VictoryArea
        labels={d => d.value}
        labelComponent={
          <ChartTooltip textRenderer={tooltipRenderFn} cardArea={cardArea} />
        }
        style={this.chartStyle}
        data={this.formattedValues}
        // This makes the chart shape based on the values
        domain={this.chartDomain}
        y="value"
        x="month"
      />
    )
  }
}

AreaChart.propTypes = {
  dataset: datasetPropType.isRequired,
  tooltipRenderFn: PropTypes.func.isRequired,
  cardArea: PropTypes.number,
}

AreaChart.defaultProps = {
  cardArea: 1,
}

export default AreaChart
