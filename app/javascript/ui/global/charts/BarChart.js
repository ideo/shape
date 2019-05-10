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

const BarChart = ({ dataset, simpleDateTooltip, cardArea }) => {
  const values = formatValues(dataset.data, dataset.order)
  const { total, max_domain } = dataset
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: max_domain,
  })
  return (
    <VictoryBar
      labels={(datum, active) => `${datum.percentage}%`}
      padding={10}
      barWidth={30}
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
                    text: `${datum.value}/${total} \ntotal`,
                    style: Object.assign({}, themeLabelStyles, {
                      fill: v.colors.tertiaryMedium,
                      fontSize: 9,
                      maxWidth: 20,
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
}

BarChart.defaultProps = {
  cardArea: 1,
}

export default BarChart
