import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import {
  LineSegment,
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryVoronoiContainer,
} from 'victory'

import { DisplayText } from '~/ui/global/styled/typography'
import OrganicGrid from '~/ui/icons/OrganicGrid'
import monthEdge from '~/utils/monthEdge'
import v, { DATASET_CHART_TYPES } from '~/utils/variables'
import AreaChart from '~/ui/global/charts/AreaChart'
import BarChart from '~/ui/global/charts/BarChart'
import LineChart from '~/ui/global/charts/LineChart'
import Tick from '~/ui/global/charts/Tick'
import {
  datasetPropType,
  utcMoment,
  victoryTheme,
  emojiSeriesForQuestionType,
} from '~/ui/global/charts/ChartUtils'

const calculateTickLabelEdges = labelText => {
  if (!labelText) return 0

  return labelText.length * 5.5
}

const TickLabel = props => {
  let dx

  if (props.x === 0) dx = calculateTickLabelEdges(props.text)
  if (props.x === 450) dx = -calculateTickLabelEdges(props.text)
  const updatedStyle = Object.assign({}, props.style, {
    fontSize: props.fontSize,
  })
  return (
    <VictoryLabel {...props} dx={dx} dy={props.dy || 5} style={updatedStyle} />
  )
}

const NotEnoughDataContainer = styled.div`
  position: relative;
  top: 50%;
  transform: translateY(-50%);
`

const ChartContainer = styled.div`
  position: absolute;
  height: ${props => props.height};
  bottom: 0;
  left: 0;
  right: 0;
`

class ChartGroup extends React.PureComponent {
  get primaryDataset() {
    const { datasets } = this.props
    if (datasets.length <= 1) return datasets[0]
    return datasets.find(dataset => dataset.order === 0)
  }

  get primaryDatasetValues() {
    if (!this.primaryDataset || !this.primaryDataset.data) return []
    return this.primaryDataset.data
  }

  get secondaryDatasetsWithData() {
    const { datasets } = this.props
    return datasets.filter(
      dataset => dataset.order !== 0 && dataset.data.length > 0
    )
  }

  get primaryDatasetBarChart() {
    return (
      this.primaryDataset &&
      this.primaryDataset.chart_type === DATASET_CHART_TYPES.BAR
    )
  }

  get isSmallChartStyle() {
    const { width, height } = this.props
    return width <= 1 && height <= 1
  }

  monthlyXAxisText = (date, index) => {
    const { timeframe } = this.primaryDataset
    const dateOperand = utcMoment(date)
    const dateNearMonthEdge = monthEdge(dateOperand, timeframe)

    if (dateNearMonthEdge) {
      const datesNearOperandAndMonthEdge = this.primaryDatasetValues.filter(
        val => {
          const dateIteratee = utcMoment(val.date)
          const valueNearMonthEdge = monthEdge(dateIteratee, timeframe)

          if (!valueNearMonthEdge) return false

          return Math.abs(dateIteratee.diff(dateOperand, 'days')) < 8
        }
      )

      if (datesNearOperandAndMonthEdge.length > 1) {
        const allDates = this.primaryDatasetValues.map(val => val.date)
        // Don't show date being operated on if it is not last one
        // This is to avoid date labels piling up on top of each other
        if (index < allDates.length - 1) return ''
      }

      return `${dateNearMonthEdge.format('MMM')}`
    }
    // Don't show the label if it's not within a certain month range
    return ''
  }

  fullDate = (date, index) => `${utcMoment(date).format('MM/DD/YY')}`

  get emojiScale() {
    const { question_type } = this.primaryDataset
    if (!question_type) return []
    return emojiSeriesForQuestionType(question_type)
  }

  get chartAxisStyle() {
    if (this.isSmallChartStyle) {
      return {
        axis: {
          stroke: v.colors.commonMedium,
          strokeWidth: 30,
          transform: 'translateY(26px)',
        },
        axisLabel: {
          padding: 0,
          fontSize: '18px',
          dy: -5,
        },
      }
    }
    return {
      axis: {
        stroke: v.colors.commonMedium,
        strokeWidth: 25,
        strokeLinecap: 'square',
        transform: 'translateY(22px)',
      },
    }
  }

  get chartAxis() {
    let tickLabelStyle = {}
    if (this.isSmallChartStyle) {
      tickLabelStyle = {
        fontSize: '18px',
        dy: -5,
      }
    } else {
      tickLabelStyle = {
        fontSize: '10px',
        dy: 5,
      }
    }

    if (this.primaryDatasetBarChart) {
      return (
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
      )
    }

    // NOTE: The transform property is for IE11 which doesn't recognize CSS
    // transform properties on SVG
    return this.primaryDatasetValues > 1 ? (
      <VictoryAxis
        tickLabelComponent={
          <TickLabel
            fontSize={tickLabelStyle.fontSize}
            dy={tickLabelStyle.dy}
          />
        }
        tickFormat={
          this.isSmallChartStyle ? this.fullDate : this.monthlyXAxisText
        }
        offsetY={13}
        style={this.chartAxisStyle}
        axisComponent={
          <LineSegment transform="translate(10 26) scale(0.955)" />
        }
      />
    ) : (
      <VictoryAxis
        axisLabelComponent={<TickLabel fontSize={tickLabelStyle.fontSize} />}
        style={this.chartAxisStyle}
        tickFormat={t => null}
        offsetY={13}
        axisComponent={
          <LineSegment transform="translate(10 26) scale(0.955)" />
        }
        label={this.fullDate(this.primaryDatasetValues[0].date)}
      />
    )
  }

  // Oddly es-lint complains when this is a get function
  renderNotEnoughData = () => (
    <NotEnoughDataContainer>
      <DisplayText className="noDataMessage">Not enough data yet</DisplayText>
    </NotEnoughDataContainer>
  )

  renderDataset = (dataset, index) => {
    const { simpleDateTooltip, width, height } = this.props
    const dashWidth = index * 2
    switch (dataset.chart_type) {
      case DATASET_CHART_TYPES.AREA:
        return AreaChart({
          dataset,
          simpleDateTooltip,
          cardArea: width * height,
        })
      case DATASET_CHART_TYPES.LINE:
        return LineChart({
          dataset,
          simpleDateTooltip,
          cardArea: width * height,
          dashWidth,
        })
      case DATASET_CHART_TYPES.BAR:
        return BarChart({
          dataset,
          cardArea: width * height,
        })
      default:
        return AreaChart({
          dataset,
          simpleDateTooltip,
          cardArea: width * height,
        })
    }
  }

  get renderedDatasets() {
    let datasetIndex = 0
    const datasets = [this.renderDataset(this.primaryDataset, datasetIndex)]
    if (!this.secondaryDatasetsWithData) return datasets
    this.secondaryDatasetsWithData.forEach(dataset =>
      datasets.push(this.renderDataset(dataset, (datasetIndex += 1)))
    )
    return datasets
  }

  get renderVictoryChart() {
    if (this.primaryDatasetBarChart) {
      return (
        <VictoryChart
          theme={victoryTheme}
          domainPadding={{ y: 10 }}
          padding={{ top: 0, left: 40, right: 40, bottom: 15 }}
        >
          <VictoryGroup offset={30}>
            {this.renderedDatasets.map(dataset => dataset)}
          </VictoryGroup>
          {this.chartAxis}
        </VictoryChart>
      )
    }
    return (
      <VictoryChart
        theme={victoryTheme}
        domainPadding={{ y: 80 }}
        padding={{ top: 0, left: 0, right: 0, bottom: 0 }}
        containerComponent={<VictoryVoronoiContainer />}
      >
        {this.renderedDatasets.map(dataset => dataset)}
        {this.chartAxis}
      </VictoryChart>
    )
  }

  render() {
    if (this.primaryDatasetValues.length === 0) {
      return this.renderNotEnoughData()
    }
    return (
      <ChartContainer
        height={this.primaryDatasetBarChart ? '100%' : '92%'}
        data-cy="ChartContainer"
      >
        <OrganicGrid />
        {this.renderVictoryChart}
      </ChartContainer>
    )
  }
}

ChartGroup.propTypes = {
  datasets: MobxPropTypes.arrayOrObservableArrayOf(datasetPropType).isRequired,
  simpleDateTooltip: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
}

ChartGroup.defaultProps = {
  simpleDateTooltip: false,
  width: 1,
  height: 1,
}

export default ChartGroup
