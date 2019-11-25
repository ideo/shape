import PropTypes from 'prop-types'
import { VictoryBar } from 'victory'
import color from 'color'

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
    label: datum.column,
  }))
}

const BarChart = ({ dataset, cardArea, barsInGroup, routeToSearch }) => {
  const values = formatValues(dataset.data, dataset.order)
  const { total, max_domain } = dataset
  const domain = chartDomainForDatasetValues({
    values,
    maxYDomain: max_domain,
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
          fontSize={10}
        />
      }
      padding={0}
      barWidth={barWidth}
      data={values}
      domain={domain}
      key={`dataset-${dataset.order}`}
      events={[
        {
          childName: 'all',
          target: 'data',
          eventHandlers: {
            onMouseOver: () => [
              {
                target: 'labels',
                mutation: props => {
                  return { active: true }
                },
              },
              {
                target: 'data',
                mutation: info => {
                  if (!info.style || !info.style.fill) return null
                  const darkerFill = color(info.style.fill)
                    .darken(0.11)
                    .string()
                  return {
                    style: Object.assign({}, info.style, {
                      fill: darkerFill,
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
              {
                target: 'data',
                mutation: props => {
                  return null
                },
              },
            ],
            onClick: (_data, el) => {
              const searchKey = el.datum.search_key
              if (searchKey) {
                routeToSearch(searchKey)
              }
            },
          },
        },
      ]}
    />
  )
}

BarChart.propTypes = {
  dataset: datasetPropType.isRequired,
  routeToSearch: PropTypes.func.isRequired,
  cardArea: PropTypes.number,
  barsInGroup: PropTypes.number,
}

BarChart.defaultProps = {
  cardArea: 1,
  barsInGroup: 1,
}

export default BarChart
