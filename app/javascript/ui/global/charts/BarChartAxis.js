import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { VictoryAxis } from 'victory'

import {
  barWidthPx,
  emojiSeriesForQuestionType,
} from '~/ui/global/charts/ChartUtils'
import Tick from '~/ui/global/charts/Tick'
import ChartLabelWithTooltip from '~/ui/global/charts/ChartLabelWithTooltip'

const emojiScale = questionType => {
  return emojiSeriesForQuestionType(questionType)
}

const maxTickLength = (totalColumns, totalGroupings) => {
  const barLength = barWidthPx(totalColumns, totalGroupings)
  const avgCharToPxRatio = 2.85
  return barLength / avgCharToPxRatio
}

const columnTickProperties = (totalColumns, totalGroupings) => {
  const Wrapper = props => (
    <ChartLabelWithTooltip
      totalColumns={totalColumns}
      maxTickLength={maxTickLength(totalColumns, totalGroupings)}
      {...props}
    />
  )

  return {
    tickValues: 'column',
    tickFormat: null,
    tickLabelComponent: <Wrapper />,
  }
}

const emojiTickProperties = questionType => {
  return {
    tickValues: [1, 2, 3, 4],
    tickFormat: emojiScale(questionType).map(e => e.symbol),
    tickLabelComponent: <Tick emojiScale={emojiScale(questionType)} />,
  }
}

const BarChartAxis = ({ primaryDataset, totalColumns, totalGroupings }) => {
  const { question_type } = primaryDataset
  const tickProperties = primaryDataset.isEmojiOrScaleQuestion
    ? emojiTickProperties(question_type)
    : columnTickProperties(totalColumns, totalGroupings)
  return (
    <VictoryAxis
      style={{
        axis: {
          strokeWidth: 0,
        },
        tickLabels: {
          textTransform: 'none',
        },
      }}
      {...tickProperties}
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
  )
}

BarChartAxis.propTypes = {
  primaryDataset: MobxPropTypes.objectOrObservableObject.isRequired,
  totalColumns: PropTypes.number.isRequired,
  totalGroupings: PropTypes.number.isRequired,
}

export default BarChartAxis
