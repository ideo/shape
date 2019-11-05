import PropTypes from 'prop-types'
import { VictoryBar } from 'victory'

import TickLabelWithTooltip from '~/ui/global/charts/TickLabelWithTooltip'
import {
  barWidthPx,
  datasetPropType,
  chartDomainForDatasetValues,
} from '~/ui/global/charts/ChartUtils'

const formatValues = (values, datasetOrder) => {
  return values.map((datum, i) => ({
    ...datum,
    x: datum.column,
    y: Math.max(datum.percentage, 0.5),
  }))
}

const BarChart = ({ dataset, cardArea, barsInGroup }) => {
  const values = formatValues(dataset.data, dataset.order)
  const { total, max_domain } = dataset
  const domain = chartDomainForDatasetValues({
    values,
    maxDomain: max_domain,
  })
  const totalBars = dataset.data.length
  const barWidth = barWidthPx(totalBars, barsInGroup)
  // Only show labels if theres room for them
  const labelRenderer = datum =>
    barsInGroup > 4 ? () => {} : `${datum.percentage}%`
  const tooltipRenderer = datum => {
    let text = `${dataset.name}
    ${datum.percentage}%
    ${datum.value}/${total} total`
    if (total === 0) {
      text = 'No comparable chart\n from this feedback'
    }
    return text
  }
  return (
    <VictoryBar
      labels={d => d.percentage}
      labelComponent={
        <TickLabelWithTooltip
          tooltipTextRenderer={tooltipRenderer}
          labelTextRenderer={labelRenderer}
          cardArea={cardArea}
          displayTicks={false}
          alwaysShowLabels={true}
        />
      }
      padding={0}
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
                  return { active: true }
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
