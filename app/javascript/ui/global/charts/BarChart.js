import PropTypes from 'prop-types'
import { VictoryBar } from 'victory'

import ChartTooltip from '~/ui/global/charts/ChartTooltip'
import {
  datasetPropType,
  emojiTooltipText,
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
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: dataset.max_domain,
  })
  const tooltipFn = datum => emojiTooltipText(datum)
  return (
    <VictoryBar
      labels={d => `${d.percentage}%`}
      labelComponent={
        <ChartTooltip textRenderer={tooltipFn} cardArea={cardArea} />
      }
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
                    text: `${datum.value}/${datum.total} \ntotal`,
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
