import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { DisplayText } from '~/ui/global/styled/typography'
import InfoIcon from '~/ui/icons/InfoIcon'
import ChartGroup from '~/ui/global/charts/ChartGroup'
import {
  primaryFillColorFromDataset,
  AboveChartContainer,
} from '~/ui/global/charts/ChartUtils'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import StyledDataItemCover from './StyledDataItemCover'

const StyledInfoIcon = styled.div`
  display: inline-block;
  vertical-align: middle;
  color: ${props => props.color};
  width: 20px;
  margin-left: 7px;
`

class DataItemCoverDisplayOnly extends React.Component {
  get title() {
    const { item } = this.props
    return item.name
  }

  get fillColor() {
    const { primaryDataset } = this.props.item
    return primaryFillColorFromDataset(primaryDataset)
  }

  get primaryDatasetDescription() {
    const { primaryDataset } = this.props.item
    return primaryDataset && primaryDataset.description
  }

  render() {
    const { card, item } = this.props
    const tooltip = this.primaryDatasetDescription
    return (
      <StyledDataItemCover>
        <AboveChartContainer>
          <DisplayText color={this.fillColor}>{this.title}</DisplayText>
          {tooltip && (
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title={tooltip}
              placement="bottom"
            >
              <StyledInfoIcon color={this.fillColor}>
                <InfoIcon
                  style={{ fill: v.colors.grayBoulder }}
                  height={11}
                  width={11}
                />
              </StyledInfoIcon>
            </Tooltip>
          )}
          <br />
        </AboveChartContainer>
        <ChartGroup
          datasets={item.datasets}
          width={card.width}
          height={card.height}
          simpleDateTooltip
        />
      </StyledDataItemCover>
    )
  }
}

DataItemCoverDisplayOnly.displayName = 'DataItemCoverDisplayOnly'

DataItemCoverDisplayOnly.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCoverDisplayOnly
