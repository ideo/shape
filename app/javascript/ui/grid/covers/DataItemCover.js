import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, computed } from 'mobx'
import moment from 'moment-mini'
import styled from 'styled-components'
import {
  Flyout,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import OrganicGridPng from '~/assets/organic_grid_black.png'
import OrganicGrid from '~/ui/icons/OrganicGrid'
import MeasureSelect from '~/ui/reporting/MeasureSelect'
import TargetButton from '~/ui/reporting/TargetButton'
import EditableButton from '~/ui/reporting/EditableButton'
import {
  DisplayText,
  SmallHelperText,
  Heading3,
  HugeNumber,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { theme } from '~/ui/test_collections/shared'

const utcMoment = date => moment(`${date} 00+0000`).utc()

const DotFlyout = props => (
  <g>
    <Flyout {...props} />
    <circle
      cx={props.x}
      cy={props.y + 9}
      r="4"
      stroke={v.colors.white}
      strokeWidth={0.5}
      fill={v.colors.black}
    />
  </g>
)

class CustomLabel extends React.Component {
  static defaultEvents = VictoryTooltip.defaultEvents

  get isLastDataPoint() {
    const { data, index } = this.props
    return parseInt(index) === data.length - 1
  }

  renderAmountMark(datum, totalData) {
    const { maxAmount, minAmount } = this.props
    if (datum.amount >= maxAmount) return true
    if (datum.amount <= minAmount) return true
    if (this.isLastDataPoint) return true
    return false
  }

  render() {
    const { data, datum, dataSettings, index, x, y } = this.props
    const showAlways = this.renderAmountMark(datum, data.length - 1)
    let dx = 0
    if (parseInt(index) === 0) {
      dx = 10
    } else if (this.isLastDataPoint) {
      dx = -10
    }
    const momentDate = utcMoment(datum.date)
    const text = `${datum.amount} ${dataSettings.d_measure}\n
      ${
        this.isLastDataPoint
          ? 'in last 30 days'
          : `${momentDate.format('MMMM D YYYY')}`
      }`
    return (
      <g>
        <VictoryTooltip
          {...this.props}
          cornerRadius={2}
          flyoutComponent={<DotFlyout />}
          height={40}
          width={140}
          dx={dx * 5}
          dy={0}
          style={{
            fill: 'white',
            fontFamily: v.fonts.sans,
            fontSize: '12px',
            fontWeight: 'normal',
          }}
          text={text}
          orientation="top"
          pointerLength={0}
          flyoutStyle={{
            transform: 'translateY(-5px)',
            stroke: 'transparent',
            fill: v.colors.black,
            opacity: 0.8,
          }}
        />
        {showAlways && (
          <Fragment>
            <VictoryTooltip
              active={showAlways}
              {...this.props}
              dx={dx}
              dy={-5}
              style={{ fontSize: '10px', fontWeight: 'normal' }}
              text={`${datum.amount}`}
              orientation="top"
              pointerLength={0}
              flyoutStyle={{ stroke: 'transparent', fill: 'transparent' }}
            />
            <line
              x1={x}
              x2={x + 8}
              y1={y + 9}
              y2={y + 9}
              dx={dx}
              stroke="black"
              strokeWidth={0.75}
            />
          </Fragment>
        )}
      </g>
    )
  }
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

  get withinText() {
    const { item } = this.props
    const { data_settings } = item
    const editable = item.can_edit_content
    let timeframeControl = <span>{data_settings.d_timeframe}</span>
    let measureControl

    const targetControl = (
      <TargetButton
        item={item}
        editable={editable}
        onClick={this.handleEditClick}
      />
    )
    if (this.editing) {
      timeframeControl = (
        <span className="editableMetric">
          <MeasureSelect
            dataSettingsName="timeframe"
            item={item}
            onSelect={this.onSelectTimeframe}
          />
        </span>
      )
      measureControl = (
        <span className="editableMetric">
          <MeasureSelect
            dataSettingsName="measure"
            item={item}
            onSelect={this.onSelectMeasure}
          />
        </span>
      )
    } else if (editable) {
      timeframeControl = (
        <EditableButton editable={editable} onClick={this.handleEditClick}>
          <span className="editableMetric">{data_settings.d_timeframe}</span>
        </EditableButton>
      )
      measureControl = (
        <EditableButton editable={editable} onClick={this.handleEditClick}>
          <span className="editableMetric">{data_settings.d_measure}</span>
        </EditableButton>
      )
    }

    if (data_settings.d_timeframe === 'ever') {
      return (
        <span>
          within the {''} {targetControl} {timeframeControl}
        </span>
      )
    }
    return (
      <Fragment>
        <Heading3>
          {measureControl} per {timeframeControl}
        </Heading3>
        <SmallHelperText color={v.colors.black}>
          <GraphKey />
          {targetControl}
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
        ? [{ type: 'Collection', target: Number(value.id) }]
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
      month: utcMoment(value.date).format('MMM DD'),
    }))
  }

  get maxAmount() {
    return Math.max(...this.formattedValues.map(d => d.amount))
  }

  get minAmount() {
    return Math.min(...this.formattedValues.map(d => d.amount))
  }

  renderSingleValue() {
    const { item } = this.props
    return (
      <Fragment>
        {!this.editing ? (
          <Heading3 onClick={this.handleEditClick} style={{ marginBottom: 0 }}>
            <span className="editableMetric">
              {item.data_settings.d_measure}
            </span>
          </Heading3>
        ) : (
          <Heading3>
            <span className="editableMetric">
              <MeasureSelect
                dataSettingsName="measure"
                item={item}
                onSelect={this.onSelectMeasure}
              />
            </span>
          </Heading3>
        )}
        <HugeNumber className="count">{item.data.value}</HugeNumber>
        <SmallHelperText color={v.colors.black}>
          {this.withinText}
        </SmallHelperText>
      </Fragment>
    )
  }

  renderTimeframeValues() {
    const { item } = this.props
    return (
      <Fragment>
        <AboveChartContainer>
          <DisplayText>{this.withinText}</DisplayText>
          <br />
          {this.formattedValues.length < 2 && (
            <DisplayText>
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
                tickFormat={(t, i) => ((i + 3) % 4 === 0 ? t : '')}
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
                  <CustomLabel
                    dataSettings={item.data_settings}
                    minAmount={this.minAmount}
                    maxAmount={this.maxAmount}
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
