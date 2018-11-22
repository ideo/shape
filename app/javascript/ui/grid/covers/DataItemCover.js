// import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import styled from 'styled-components'
import { VictoryArea, VictoryChart } from 'victory'

import MeasureSelect from '~/ui/reporting/MeasureSelect'
import {
  SmallHelperText,
  Heading3,
  HugeNumber,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { theme } from '~/ui/test_collections/shared'

const StyledDataItemCover = styled.div`
  background-color: ${v.colors.commonLight};
  border-top: 2px solid ${v.colors.black};
  height: 100%;
  padding: 15px 0;
  text-align: left;

  .measure,
  .timeframe {
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

class DataItemCover extends React.PureComponent {
  state = { selectOpen: false }

  // eslint-disable-next-line
  get withinText() {
    const { item } = this.props
    const { data_settings } = item
    const editable = item.can_edit_content
    let timeframeControl = <span>{data_settings.d_timeframe}</span>
    if (this.state.selectOpen) {
      timeframeControl = (
        <MeasureSelect
          dataSettingsName="timeframe"
          item={item}
          onSelect={this.onSelectTimeframe}
        />
      )
    } else if (editable) {
      timeframeControl = (
        <button onClick={this.handleEditClick} className="timeframe">
          {data_settings.d_timeframe}
        </button>
      )
    }
    return (
      <span>
        within the {''} Organization {timeframeControl}
      </span>
    )
  }

  onSelectTimeframe = value => {
    this.saveSettings({
      d_timeframe: value,
    })
  }

  onSelectMeasure = value => {
    this.saveSettings({
      d_measure: value,
    })
  }

  async saveSettings(settings) {
    const { item } = this.props
    runInAction(() => {
      item.data_settings = Object.assign({}, item.data_settings, settings)
    })
    const res = await item.save()
    // TODO: investigate why data isn't being updated with just `save()`
    runInAction(() => {
      item.update(res.data)
    })
    this.setState({ selectOpen: false })
  }

  handleEditClick = ev => {
    const { item } = this.props
    if (!item.can_edit_content) return
    this.setState({ selectOpen: true })
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
      <VictoryChart theme={theme}>
        <VictoryArea
          style={{ data: { fill: '#c43a31' } }}
          data={this.formattedValues}
          y="amount"
          x="date"
        />
      </VictoryChart>
    )
  }

  render() {
    const { item } = this.props
    return (
      <StyledDataItemCover
        className="cancelGridClick"
        editable={item.can_edit_content}
      >
        <Heading3 className="measure" onClick={this.handleEditClick}>
          {item.data_settings.d_measure}
        </Heading3>
        {this.state.selectOpen && (
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
}

export default DataItemCover
