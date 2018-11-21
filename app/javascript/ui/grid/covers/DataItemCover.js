// import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import styled from 'styled-components'

import MeasureSelect from '~/ui/reporting/MeasureSelect'
import {
  SmallHelperText,
  Heading3,
  HugeNumber,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const StyledDataItemCover = styled.div`
  background-color: ${v.colors.commonLight};
  border-top: 2px solid ${v.colors.black};
  height: 100%;
  padding: 15px 0;
  text-align: left;

  .measure {
    width: calc(100% - 60px);
    ${props =>
      props.editable &&
      `
    &:hover {
      background-color: ${v.colors.primaryLight};
    }
    `};
  }
`

class DataItemCover extends React.PureComponent {
  state = { selectOpen: false }

  // eslint-disable-next-line
  get withinText() {
    const { item } = this.props
    const { data_settings } = item
    const editable = item.can_edit_content
    const timeframeControl = editable ? (
      <button onClick={this.handleTimeframeClick}>
        {data_settings.d_timeframe}
      </button>
    ) : (
      <span>{data_settings.d_timeframe}</span>
    )
    return (
      <span>
        within the {''} Organization {timeframeControl}
      </span>
    )
  }

  onSelect = async value => {
    const { item } = this.props
    runInAction(() => {
      item.data_settings.d_measure = value
    })
    const res = await item.save()
    // TODO: investigate why data isn't being updated with just `save()`
    runInAction(() => {
      item.update(res.data)
    })
    this.setState({ selectOpen: false })
  }

  handleMeasureClick = ev => {
    const { item } = this.props
    if (!item.can_edit_content) return
    this.setState({ selectOpen: true })
  }

  render() {
    const { item } = this.props
    return (
      <StyledDataItemCover
        className="cancelGridClick"
        editable={item.can_edit_content}
      >
        <Heading3 className="measure" onClick={this.handleMeasureClick}>
          {item.data_settings.d_measure}
        </Heading3>
        {this.state.selectOpen ? (
          <MeasureSelect item={item} onSelect={this.onSelect} />
        ) : (
          <Fragment>
            <HugeNumber className="count">{item.data.count}</HugeNumber>
            <SmallHelperText color={v.colors.black}>
              {this.withinText}
            </SmallHelperText>
          </Fragment>
        )}
      </StyledDataItemCover>
    )
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
