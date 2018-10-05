import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel } from 'victory'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import { Heading1, Heading3 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { questionInformation } from '~/ui/test_collections/shared'

const CoverContainer = styled.div`
  padding: 16px;
`

const Tick = props => {
  const emoji = props.emojiScale[props.index]
  if (!emoji) return <div />
  const fontSize = parseInt((emoji.scale || 1) * 24)
  console.log('fz', fontSize)
  return <VictoryLabel {...props} style={{ fill: '#DE8F74', fontSize }} />
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
    const formattedData = []
    const total = Object.keys(item.chart_data).reduce(
      (previous, key) => previous + item.chart_data[key],
      0
    )
    _.forEach(item.chart_data, (value, key) => {
      formattedData.push({ scale: key, value: parseInt((value / total) * 100) })
    })
    return formattedData
  }

  get mapQuestionType() {
    const { questionTitle, questionText } = questionInformation(
      this.question.question_type
    )
    return { questionTitle, questionText }
  }

  get emojiScale() {
    if (!this.question) return []
    const { emojiSeries } = questionInformation(this.question.question_type)
    return emojiSeries
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
            labels={d => `${d.value}%`}
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
