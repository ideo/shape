import PropTypes from 'prop-types'
import { VictoryBar } from 'victory'

import {
  datasetPropType,
  chartDomainForDatasetValues,
  themeLabelStyles,
} from '~/ui/global/charts/ChartUtils'
import v from '~/utils/variables'

const formatValues = (values, datasetOrder) => {
  return values.map((datum, i) => ({
    ...datum,
    x: datum.column,
    y: Math.max(datum.percentage, 0.5),
  }))
}

const BarChart = ({ dataset, simpleDateTooltip, cardArea, barsInGroup }) => {
  const values = formatValues(dataset.data, dataset.order)
  const { total, max_domain } = dataset
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: max_domain,
  })
  const barWidth = barsInGroup > 3 ? 30 / (barsInGroup / 2) : 30
  console.log('poop', dataset)
  return (
    <VictoryBar
      labels={(datum, active) => `${datum.percentage}%`}
      padding={10 / barsInGroup}
      barWidth={barWidth}
      data={values}
      domain={domain}
      key={`dataset-${dataset.order}`}
      events={[
        {
          target: 'data',
          eventHandlers: {
            onMouseOver: () => [
              {
                target: 'labels',
                mutation: props => {
                  const { datum } = props
                  return {
                    text: `${dataset.measure} | ${datum.percentage}% | ${
                      datum.value
                    }/${total} \ntotal`,
                    style: Object.assign({}, themeLabelStyles, {
                      fill: v.colors.black,
                      fontSize: 7,
                      maxWidth: 10,
                    }),
                  }
                },
              },
            ],
            onMouseOut: () => [
              {
                target: 'labels',
                mutation: props => null,
              },
            ],
          },
        },
      ]}
    />
  )
}

BarChart.propTypes = {
  dataset: datasetPropType.isRequired,
  cardArea: PropTypes.number,
  barsInGroup: PropTypes.number,
}

BarChart.defaultProps = {
  cardArea: 1,
  barsInGroup: 1,
}

export default BarChart
