import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Fragment } from 'react'

import { Heading1, Heading3 } from '~/ui/global/styled/typography'
import InfoIcon from '~/ui/icons/InfoIcon'
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

const StyledInfoIcon = styled.div`
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

const StyledCover = props => {
  const { isReportTypeQuestionItem } = props.item
  if (isReportTypeQuestionItem) {
    return (
      <StyledDataItemQuestionCover>
        {props.children}
      </StyledDataItemQuestionCover>
    )
  }
  return <StyledDataItemCover>{props.children}</StyledDataItemCover>
}

class DataItemCoverDisplayOnly extends React.Component {
  get title() {
    const { item } = this.props
    if (item.isReportTypeQuestionItem) {
      return this.questionItemTitleAndDescription
    } else {
      return <Heading3 color={this.fillColor}>{item.name}</Heading3>
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
    const { question_title, question_description } = this.props.item
    return (
      <Fragment>
        {question_title && (
          <Heading1 style={{ marginTop: 0 }} notResponsive>
            {question_title}
          </Heading1>
        )}
        {question_description && <Heading3>{question_description}</Heading3>}
      </Fragment>
    )
  }

  render() {
    const { card, item } = this.props
    const tooltip = this.primaryDatasetDescription
    return (
      <StyledCover item={item} data-cy="DataItemCover">
        <AboveChartContainer>
          <StyledTitleAndDescription>
            <StyledTitleDescInline>{this.title}</StyledTitleDescInline>
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
          </StyledTitleAndDescription>
        </AboveChartContainer>
        <ChartGroup
          datasets={item.datasets}
          width={card.width}
          height={card.height}
          simpleDateTooltip
        />
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
