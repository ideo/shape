import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, computed } from 'mobx'
import moment from 'moment-mini'
import styled from 'styled-components'
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryVoronoiContainer,
} from 'victory'

import {
  DisplayText,
  SmallHelperText,
  Heading3,
  HugeNumber,
} from '~/ui/global/styled/typography'
import ChartTooltip from '~/ui/global/ChartTooltip'
import EditableButton from '~/ui/reporting/EditableButton'
import MeasureSelect from '~/ui/reporting/MeasureSelect'
import OrganicGridPng from '~/assets/organic_grid_black.png'
import OrganicGrid from '~/ui/icons/OrganicGrid'
import TargetButton from '~/ui/reporting/TargetButton'
import TargetSelect from '~/ui/reporting/TargetSelect'
import v from '~/utils/variables'
import { theme } from '~/ui/test_collections/shared'

const utcMoment = date => moment(`${date} 00+0000`).utc()
const nearMonth = momentDate => {
  const mStart = momentDate.clone().startOf('month')
  const mEnd = momentDate.clone().endOf('month')
  const startDiff = Math.abs(mStart.diff(momentDate, 'days'))
  const endDiff = Math.abs(
    momentDate
      .clone()
      .endOf('month')
      .diff(momentDate, 'days')
  )
  if (startDiff <= 2) {
    return mStart.subtract(1, 'month')
  } else if (endDiff <= 2) {
    return mEnd
  }
  return false
}

const TickLabel = props => {
  let dx
  if (props.x === 0) dx = 12
  if (props.x === 450) dx = -12
  const updatedStyle = Object.assign({}, props.style, {
    fontSize: '10px',
  })
  return <VictoryLabel {...props} dx={dx} dy={5} style={updatedStyle} />
}

const StyledDataItemCover = styled.div`
  background-color: ${v.colors.commonLight};
  border-top: 2px solid ${v.colors.black};
  height: 100%;
  padding: 15px 0;
  text-align: left;

  .editableMetric {
    ${props =>
      props.editable &&
      `
    &:hover {
      background-color: ${v.colors.primaryLight};
    }
    ${props.editing &&
      `
      background-color: ${v.colors.primaryLight};
`};
`};
  }
`
StyledDataItemCover.displayName = 'StyledDataItemCover'

const AboveChartContainer = styled.div`
  position: absolute;
  z-index: ${v.zIndex.floatOverContent};
`

const ChartContainer = styled.div`
  bottom: 0px;
  height: 92%;
  position: absolute;
  width: 100%;
`

const GraphKey = styled.span`
  background: url(${OrganicGridPng});
  background-size: 150%;
  display: inline-block;
  height: 16px;
  margin-right: 10px;
  vertical-align: middle;
  width: 16px;
`

// eslint-disable-next-line react/no-multi-comp
@inject('uiStore')
@observer
class DataItemCover extends React.Component {
  @computed
  get editing() {
    const { card, uiStore } = this.props
    return uiStore.editingCardId === card.id
  }

  toggleEditing() {
    const { card, uiStore } = this.props
    uiStore.toggleEditingCardId(card.id)
  }

  get timeframeControl() {
    const { item } = this.props
    const { data_settings } = item
    const editable = item.can_edit_content
    if (this.editing) {
      return (
        <span className="editableMetric">
          <MeasureSelect
            dataSettingsName="timeframe"
            item={item}
            onSelect={this.onSelectTimeframe}
          />
        </span>
      )
    } else if (editable) {
      return (
        <EditableButton editable={editable} onClick={this.handleEditClick}>
          <span className="editableMetric">{data_settings.d_timeframe}</span>
        </EditableButton>
      )
    }
    return <span>{data_settings.d_timeframe}</span>
  }

  get measureControl() {
    const { item } = this.props
    const { data_settings } = item
    const editable = item.can_edit_content
    if (this.editing) {
      return (
        <span className="editableMetric">
          <MeasureSelect
            className="editableMetric metric-measure"
            dataSettingsName="measure"
            item={item}
            onSelect={this.onSelectMeasure}
          />
        </span>
      )
    } else if (editable) {
      return (
        <EditableButton editable={editable} onClick={this.handleEditClick}>
          <span className="editableMetric">{data_settings.d_measure}</span>
        </EditableButton>
      )
    }
    return <span>{data_settings.d_measure}</span>
  }

  get targetControl() {
    const { item } = this.props
    const editable = item.can_edit_content

    if (this.editing) {
      return (
        <span className="editableMetric">
          <TargetSelect item={item} onSelect={this.onSelectTarget} />
        </span>
      )
    }
    return (
      <TargetButton
        item={item}
        editable={editable}
        onClick={this.handleEditClick}
      />
    )
  }

  get withinText() {
    const { item } = this.props
    const { data_settings } = item
    if (data_settings.d_timeframe === 'ever') {
      return (
        <span className="withinText">
          within the {''} {this.targetControl} {this.timeframeControl}
        </span>
      )
    }
    return (
      <Fragment>
        <Heading3>
          {this.measureControl} per {this.timeframeControl}
        </Heading3>
        <SmallHelperText color={v.colors.black}>
          <GraphKey />
          {this.targetControl}
        </SmallHelperText>
      </Fragment>
    )
  }

  onSelectTimeframe = value => {
    this.saveSettings({
      d_timeframe: value,
    })
  }

  onSelectTarget = value => {
    this.saveSettings({
      d_filters: value
        ? [{ type: 'Collection', target: Number(value.custom) }]
        : [],
    })
    this.toggleEditing()
  }

  onSelectMeasure = value => {
    // don't allow setting null measure
    if (!value) return
    this.saveSettings({
      d_measure: value,
    })
  }

  get correctGridSize() {
    const { item } = this.props
    const { data_settings } = item
    const size = data_settings.d_timeframe === 'ever' ? 1 : 2
    return { width: size, height: size }
  }

  async saveSettings(settings) {
    const { card, item, uiStore } = this.props
    runInAction(() => {
      item.data_settings = Object.assign({}, item.data_settings, settings)
    })
    const res = await item.save()
    // If the timeframe changed we have to resize the card
    if (settings.d_timeframe) {
      const { height, width } = this.correctGridSize
      card.height = height
      card.width = width
      await card.save()
    }
    // TODO: investigate why data isn't being updated with just `save()`
    runInAction(() => {
      item.update(res.data)
      this.toggleEditing()
      uiStore.toggleEditingCardId(card.id)
    })
  }

  handleEditClick = ev => {
    const { card, item, uiStore } = this.props
    if (!item.can_edit_content) return
    uiStore.toggleEditingCardId(card.id)
  }

  get formattedValues() {
    const { item } = this.props
    const {
      data: { values },
    } = item
    if (!values) return []
    return values.map((value, i) => ({
      ...value,
      month: value.date,
    }))
  }

  get maxAmount() {
    return Math.max(...this.formattedValues.map(d => d.amount))
  }

  get minAmount() {
    return Math.min(...this.formattedValues.map(d => d.amount))
  }

  renderLabelText = (datum, isLastDataPoint) => {
    const { item } = this.props
    const { d_measure } = item.data_settings
    const momentDate = utcMoment(datum.date)
    let monthRange = `${momentDate
      .clone()
      .subtract(30, 'days')
      .format('MMM D')} - ${momentDate.format('MMM D')}`

    const near = nearMonth(momentDate)
    if (near) {
      monthRange = `in ${near.format('MMMM')}`
    }
    const text = `${datum.amount} ${d_measure}\n
      ${isLastDataPoint ? 'in last 30 days' : monthRange}`

    return text
  }

  renderSingleValue() {
    const { item } = this.props
    return (
      <Fragment>
        <Heading3>{this.measureControl}</Heading3>
        <HugeNumber className="count">{item.data.value}</HugeNumber>
        <SmallHelperText color={v.colors.black}>
          {this.withinText}
        </SmallHelperText>
      </Fragment>
    )
  }

  displayXAxisText = (d, i) => {
    const utc = utcMoment(d)
    const near = nearMonth(utc)
    if (near) {
      return `${near.format('MMM')}`
    } else if (utc.diff(moment().utc(), 'days') === 0) {
      return 'Today'
    }
    return ''
  }

  renderTimeframeValues() {
    return (
      <Fragment>
        <AboveChartContainer>
          <DisplayText>{this.withinText}</DisplayText>
          <br />
          {this.formattedValues.length < 2 && (
            <DisplayText className="noDataMessage">
              <br />
              Not enough data yet
            </DisplayText>
          )}
        </AboveChartContainer>
        {this.formattedValues.length >= 2 && (
          <ChartContainer>
            <OrganicGrid />
            <VictoryChart
              theme={theme}
              domainPadding={{ y: 80 }}
              padding={{ top: 0, left: 0, right: 0, bottom: 0 }}
              containerComponent={<VictoryVoronoiContainer />}
            >
              <VictoryAxis
                tickLabelComponent={<TickLabel />}
                tickFormat={this.displayXAxisText}
                offsetY={13}
                style={{
                  axis: {
                    stroke: v.colors.commonMedium,
                    strokeWidth: 25,
                    transform: 'translateY(22px)',
                  },
                }}
              />
              <VictoryArea
                labels={d => d.amount}
                labelComponent={
                  <ChartTooltip
                    minAmount={this.minAmount}
                    maxAmount={this.maxAmount}
                    textRenderer={this.renderLabelText}
                  />
                }
                style={{
                  data: { fill: 'url(#organicGrid)' },
                  labels: {
                    fill: 'black',
                  },
                }}
                data={this.formattedValues}
                y="amount"
                x="month"
              />
            </VictoryChart>
          </ChartContainer>
        )}
      </Fragment>
    )
  }

  render() {
    const { item, uiStore } = this.props
    if (uiStore.isNewCard(item.id)) {
      uiStore.removeNewCard(item.id)
      this.toggleEditing()
    }
    return (
      <StyledDataItemCover
        className="cancelGridClick"
        editable={item.can_edit_content}
        editing={this.editing}
      >
        {item.data_settings.d_timeframe === 'ever'
          ? this.renderSingleValue()
          : this.renderTimeframeValues()}
      </StyledDataItemCover>
    )
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

DataItemCover.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
