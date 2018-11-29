import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import styled from 'styled-components'
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import MeasureSelect from '~/ui/reporting/MeasureSelect'
import TargetSelect from '~/ui/reporting/TargetSelect'
import TargetButton from '~/ui/reporting/TargetButton'
import EditableButton from '~/ui/reporting/EditableButton'
import {
  SmallHelperText,
  Heading3,
  HugeNumber,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { theme } from '~/ui/test_collections/shared'

class CustomLabel extends React.Component {
  static defaultEvents = VictoryTooltip.defaultEvents
  render() {
    const { data, datum, index, maxAmount } = this.props
    let active
    if (datum.amount >= maxAmount) {
      active = true
    } else {
      active = this.props.active
    }
    let dx = 0
    if (parseInt(index) === 0) {
      dx = 10
    } else if (parseInt(index) === data.length - 1) {
      dx = -10
    }
    return (
      <g>
        <VictoryTooltip
          active={active}
          {...this.props}
          dx={dx}
          dy={0}
          style={{ fontSize: '10px', fontWeight: 'normal' }}
          text={`${datum.amount}`}
          orientation="top"
          pointerLength={0}
          flyoutStyle={{ stroke: 'transparent', fill: 'transparent' }}
        />
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

  .measure {
    ${props =>
      props.editable &&
      `
      &:hover {
        background-color: ${v.colors.primaryLight};
      }
`};
  }
`

const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// eslint-disable-next-line
class DataItemCover extends React.PureComponent {
  state = { editting: false }

  // eslint-disable-next-line
  get withinText() {
    const { item } = this.props
    const { data_settings } = item
    const editable = item.can_edit_content
    let timeframeControl = <span>{data_settings.d_timeframe}</span>
    let targetControl

    if (this.state.editting) {
      targetControl = (
        <TargetSelect item={item} onSelect={this.onSelectTarget} />
      )

      timeframeControl = (
        <MeasureSelect
          dataSettingsName="timeframe"
          item={item}
          onSelect={this.onSelectTimeframe}
        />
      )
    } else if (editable) {
      targetControl = (
        <TargetButton
          item={item}
          editable={editable}
          onClick={this.handleEditClick}
        />
      )
      timeframeControl = (
        <EditableButton editable={editable} onClick={this.handleEditClick}>
          {data_settings.d_timeframe}
        </EditableButton>
      )
    }
    return (
      <span>
        within the {''} {targetControl} {timeframeControl}
      </span>
    )
  }

  onSelectTimeframe = value => {
    this.saveSettings({
      d_timeframe: value,
    })
  }

  onSelectTarget = value => {
    this.saveSettings({
      d_filters: value ? [{ type: 'Collection', target: Number(value) }] : [],
    })
  }

  onSelectMeasure = value => {
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
    const { card, item } = this.props
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
    })
    this.setState({ editting: false })
  }

  handleEditClick = ev => {
    const { item } = this.props
    if (!item.can_edit_content) return
    this.setState({ editting: true })
  }

  get formattedValues() {
    const { item } = this.props
    const {
      data: { values },
    } = item
    if (!values) return []
    return values.map(value =>
      Object.assign({}, value, {
        date: shortMonths[new Date(value.date).getMonth()],
      })
    )
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
        <HugeNumber className="count">{item.data.value}</HugeNumber>
        <SmallHelperText color={v.colors.black}>
          {this.withinText}
        </SmallHelperText>
      </Fragment>
    )
  }

  renderTimeframeValues() {
    return (
      <Fragment>
        <SmallHelperText color={v.colors.black}>
          {this.withinText}
        </SmallHelperText>
        <div
          style={{
            bottom: 0,
            position: 'absolute',
            width: '100%',
            height: 'calc(100% - 60px)',
          }}
        >
          <VictoryChart
            theme={theme}
            domainPadding={{ y: 80 }}
            padding={{ top: 0, left: 0, right: 0, bottom: 20 }}
            containerComponent={<VictoryVoronoiContainer />}
          >
            <VictoryAxis
              tickLabelComponent={<TickLabel />}
              style={{
                axis: {
                  stroke: v.colors.commonMedium,
                  strokeWidth: 25,
                  transform: 'translateY(22px)',
                },
              }}
            />
            <VictoryArea
              labels={d => (d.amount >= this.maxAmount ? d.amount : '')}
              labelComponent={<CustomLabel maxAmount={this.maxAmount} />}
              style={{
                data: { fill: '#c43a31' },
                labels: {
                  fill: 'black',
                },
              }}
              data={this.formattedValues}
              y="amount"
              x="date"
            />
          </VictoryChart>
        </div>
      </Fragment>
    )
  }

  render() {
    const { item } = this.props
    return (
      <StyledDataItemCover
        className="cancelGridClick"
        editable={item.can_edit_content}
      >
        <Heading3
          className="measure"
          onClick={this.handleEditClick}
          style={{ marginBottom: 0 }}
        >
          {item.data_settings.d_measure}
        </Heading3>
        {this.state.editting && (
          <MeasureSelect
            dataSettingsName="measure"
            item={item}
            onSelect={this.onSelectMeasure}
          />
        )}
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

export default DataItemCover
