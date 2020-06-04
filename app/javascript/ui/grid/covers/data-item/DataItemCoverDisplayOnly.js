import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Fragment } from 'react'

import { Heading1, Heading3 } from '~/ui/global/styled/typography'
import InfoIcon from '~/ui/icons/InfoIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import ChartGroup from '~/ui/global/charts/ChartGroup'
import {
  primaryFillColorFromDataset,
  AboveChartContainer,
} from '~/ui/global/charts/ChartUtils'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import {
  StyledDataItemCover,
  StyledDataItemQuestionCover,
} from './StyledDataItemCover'

const StyledIconHolder = styled.div`
  display: inline-block;
  vertical-align: middle;
  color: ${props => props.color};
  width: 20px;
  margin-left: 7px;
`

const StyledTitleAndDescription = styled.div`
  margin-bottom: 20px;
`

const StyledTitleDescInline = styled.div`
  display: inline-block;
`

const UnPaddedHeading3 = styled(Heading3)`
  margin-bottom: 0;
`

const StyledCover = props => {
  const { isReportTypeQuestionItem } = props.item
  if (isReportTypeQuestionItem) {
    return (
      <StyledDataItemQuestionCover data-cy="DataItemCover">
        {props.children}
      </StyledDataItemQuestionCover>
    )
  }
  return (
    <StyledDataItemCover data-cy="DataItemCover">
      {props.children}
    </StyledDataItemCover>
  )
}
StyledCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  children: PropTypes.node,
}
StyledCover.defaultProps = {
  children: null,
}

@observer
class DataItemCoverDisplayOnly extends React.Component {
  get title() {
    const { item } = this.props
    if (item.isReportTypeQuestionItem) {
      return this.questionItemTitleAndDescription
    } else {
      return <Heading3>{item.name}</Heading3>
    }
  }

  get fillColor() {
    const { primaryDataset } = this.props.item
    return primaryFillColorFromDataset(primaryDataset)
  }

  get primaryDatasetDescription() {
    const { primaryDataset } = this.props.item
    return primaryDataset && primaryDataset.description
  }

  get questionItemTitleAndDescription() {
    const { title, description } = this.props.item
    return (
      <Fragment>
        {title && (
          <Heading1 style={{ marginTop: 0 }} notResponsive>
            {title}
          </Heading1>
        )}
        {description && <UnPaddedHeading3>{description}</UnPaddedHeading3>}
      </Fragment>
    )
  }

  render() {
    const { card, item } = this.props
    const { primaryDataset } = item
    const tooltip = this.primaryDatasetDescription
    return (
      <StyledCover item={item}>
        <AboveChartContainer>
          <StyledTitleAndDescription>
            <StyledTitleDescInline>{this.title}</StyledTitleDescInline>
            {tooltip && (
              <Tooltip
                classes={{ tooltip: 'Tooltip' }}
                title={tooltip}
                placement="bottom"
              >
                <StyledIconHolder color={this.fillColor}>
                  <InfoIcon
                    style={{ fill: v.colors.grayBoulder }}
                    height={11}
                    width={11}
                  />
                </StyledIconHolder>
              </Tooltip>
            )}
          </StyledTitleAndDescription>
        </AboveChartContainer>
        {!primaryDataset || item.loadingDatasets ? (
          <InlineLoader />
        ) : (
          <ChartGroup
            dataItem={item}
            width={card.width}
            height={card.height}
            simpleDateTooltip
          />
        )}
      </StyledCover>
    )
  }
}

DataItemCoverDisplayOnly.displayName = 'DataItemCoverDisplayOnly'

DataItemCoverDisplayOnly.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCoverDisplayOnly
