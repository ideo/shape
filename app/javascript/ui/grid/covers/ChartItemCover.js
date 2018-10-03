import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel } from 'victory'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import { Heading1, Heading3 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const CoverContainer = styled.div`
  padding: 16px;
`

const Tick = props => {
  const emoji = props.emojiScale[props.index]
  if (!emoji) return <div />
  return <VictoryLabel {...props} style={{ fill: '#DE8F74', fontSize: 16 }} />
}
Tick.propTypes = {
  index: PropTypes.number.isRequired,
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
    const formattedData = []
    const total = Object.keys(item.chart_data).reduce(
      (previous, key) => previous + item.chart_data[key],
      0
    )
    console.log(total)
    _.forEach(item.chart_data, (value, key) => {
      formattedData.push({ scale: key, value: parseInt((value / total) * 100) })
    })
    return formattedData
  }

  get mapQuestionType() {
    // TODO combine this with Question
    switch (this.question.question_type) {
      case 'question_context':
        return {
          title: 'Category Satisfaction',
          byline: 'How satisfied are you with your current solution?',
        }
      case 'question_useful':
        return {
          title: 'Usefulness',
          byline: 'How useful is this idea for you?',
        }

      default:
        return {}
    }
  }

  get emojiScale() {
    if (!this.question) return []
    // TODO combine this with Question
    switch (this.question.question_type) {
      case 'question_context':
        return [
          { number: 1, name: 'terrible', symbol: '😡' },
          { number: 2, name: 'bad', symbol: '☹️' },
          { number: 3, name: 'good', symbol: '😊' },
          { number: 4, name: 'great', symbol: '😍' },
        ]
      case 'question_useful':
        return [
          { number: 1, name: 'terrible', symbol: '👎' },
          { number: 2, name: 'bad', scale: 0.6, symbol: '👎' },
          { number: 3, name: 'good', scale: 0.6, symbol: '👍' },
          { number: 4, name: 'great', symbol: '👍' },
        ]

      default:
        return []
    }
  }

  render() {
    return (
      <CoverContainer>
        {this.question && (
          <div>
            <Heading1>{this.mapQuestionType.title}</Heading1>
            <Heading3>{this.mapQuestionType.byline}</Heading3>
          </div>
        )}
        <VictoryChart domainPadding={14}>
          <VictoryAxis
            style={{
              axis: { stroke: 'transparent' },
            }}
            tickValues={[0, 1, 2, 3]}
            tickFormat={this.emojiScale.map(e => e.symbol)}
            tickLabelComponent={<Tick emojiScale={this.emojiScale} />}
          />
          <VictoryBar
            data={this.formattedData}
            x="scale"
            y="value"
            labels={d => console.log(d) || `${d.value}%`}
            style={{
              data: { fill: '#DE8F74' },
              labels: {
                fontFamily: v.fonts.sans,
                fontSize: 16,
                fill: '#DE8F74',
              },
            }}
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
