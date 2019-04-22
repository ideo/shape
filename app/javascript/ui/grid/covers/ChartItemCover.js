import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLegend,
} from 'victory'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import { Heading1, Heading3 } from '~/ui/global/styled/typography'
import {
  questionInformation,
  theme,
  themeLabelStyles,
} from '~/ui/test_collections/shared'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const CoverContainer = styled.div`
  height: 87%;
  padding: 16px;
`

const Tick = props => {
  const emoji = props.emojiScale[props.index]
  if (!emoji) return <div />
  const fontSize = parseInt((emoji.scale || 1) * 24)
  return (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={emoji.name}
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
  emojiScale: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      symbol: PropTypes.string,
      scale: PropTypes.number,
    })
  ).isRequired,
}

@observer
class ChartItemCover extends React.Component {
  @observable
  question = null

  componentDidMount() {
    this.fetchQuestionItem()
  }

  async fetchQuestionItem() {
    const { item } = this.props
    const { data_source_id } = item
    const questionResponse = await apiStore.fetch('items', data_source_id)
    runInAction(() => (this.question = questionResponse.data))
  }

  get formattedData() {
    const { item } = this.props
    const raw = item.chart_data
    const formatted = raw.datasets.map(set => {
      const formattedPercentage = set.data.map(d => {
        const percentage =
          set.total > 0 ? parseInt((d.num_responses / set.total) * 100) : 0
        return {
          ...d,
          percentage,
          total: set.total,
          type: set.type,
        }
      })
      return { ...set, data: formattedPercentage }
    })
    return { datasets: formatted }
  }

  get mapQuestionType() {
    const { questionTitle } = questionInformation(this.question)
    let { questionText } = questionInformation(this.question)
    if (this.question.question_type === 'question_category_satisfaction') {
      questionText += ` ${this.question.content}`
    }

    return { questionTitle, questionText }
  }

  get emojiScale() {
    if (!this.question) return []
    const { emojiSeries } = questionInformation(this.question)
    return emojiSeries
  }

  render() {
    const currentOrgName = apiStore.currentUserOrganization.name
    const { testCollection } = this.props
    return (
      <CoverContainer data-cy="ChartItemCover">
        {this.question && (
          <div>
            <Heading1>{this.mapQuestionType.questionTitle}</Heading1>
            <Heading3>{this.mapQuestionType.questionText}</Heading3>
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
            tickValues={[1, 2, 3, 4]}
            tickFormat={this.emojiScale.map(e => e.symbol)}
            tickLabelComponent={<Tick emojiScale={this.emojiScale} />}
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
            {this.formattedData.datasets.map(d => (
              <VictoryBar
                key={d.type}
                padding={10}
                data={d.data}
                barWidth={30}
                x="answer"
                y={datum => Math.max(datum.percentage, 0.5)}
                labels={(datum, active) =>
                  datum.type === 'question_items' ? `${datum.percentage}%` : ''
                }
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
                              text: `${datum.num_responses}/${
                                datum.total
                              } \ntotal`,
                              style: Object.assign({}, themeLabelStyles, {
                                fill:
                                  d.type === 'question_items'
                                    ? v.colors.tertiaryMedium
                                    : v.colors.primaryMediumDark,
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
            ))}
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
            data={[
              { name: testCollection.name },
              { name: `${currentOrgName} Organization` },
            ]}
          />
        </VictoryChart>
      </CoverContainer>
    )
  }
}

ChartItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  testCollection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ChartItemCover
