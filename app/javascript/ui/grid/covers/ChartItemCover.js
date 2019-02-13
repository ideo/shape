import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLegend,
} from 'victory'
import styled from 'styled-components'

import { Heading1, Heading3 } from '~/ui/global/styled/typography'
import { theme, themeLabelStyles } from '~/ui/test_collections/shared'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const CoverContainer = styled.div`
  padding: 16px;
`

const Tick = props => {
  const label = props.scale[props.index]
  if (!label) return <div />
  const fontSize = parseInt(1 * 24)
  return (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={label.title}
      placement="top"
      open={props.isHovered}
    >
      <VictoryLabel
        {...props}
        style={{ fill: v.colors.tertiaryMedium, fontSize }}
      />
    </Tooltip>
  )
}
Tick.propTypes = {
  scale: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      symbol: PropTypes.string,
      icon: PropTypes.string,
    })
  ).isRequired,
}

@observer
class ChartItemCover extends React.Component {
  get data() {
    return this.props.item.chart_data
  }

  render() {
    return (
      <CoverContainer data-cy="ChartItemCover">
        {this.data && (
          <div>
            <Heading1>{this.data.title}</Heading1>
            <Heading3>{this.data.subtitle}</Heading3>
          </div>
        )}
        <VictoryChart
          domainPadding={{ y: 10 }}
          domain={{ y: [0, 95] }}
          theme={theme}
        >
          <VictoryAxis
            style={{
              axis: { stroke: 'transparent' },
            }}
            tickValues={this.data.columns.map(col => col.title)}
            tickFormat={this.data.columns.map(col => col.title)}
            tickLabelComponent={<Tick scale={this.data.columns} />}
            events={[
              {
                eventHandlers: {
                  onMouseOver: () => [
                    {
                      target: 'tickLabels',
                      mutation: props => ({
                        isHovered: true,
                      }),
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
          <VictoryGroup offset={30}>
            {this.data.datasets.map(
              d =>
                console.log('d', { ...d }) || (
                  <VictoryBar
                    key={d.type}
                    padding={10}
                    data={[...d.data]}
                    barWidth={30}
                    x="column"
                    y={datum => Math.max(datum.value, 0.5)}
                    labels={(datum, active) => datum.label}
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
                                  text: `${datum.column_total}/${
                                    datum.total
                                  } \ntotal`,
                                  style: Object.assign({}, themeLabelStyles, {
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
            )}
          </VictoryGroup>
          <VictoryLegend
            x={4}
            y={4}
            borderPadding={0}
            gutter={0}
            orientation="vertical"
            padding={0}
            rowGutter={0}
            style={{ fill: 'white' }}
            data={this.data.datasets.map(set => set.label)}
          />
        </VictoryChart>
      </CoverContainer>
    )
  }
}

ChartItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ChartItemCover
