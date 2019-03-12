import { startCase } from 'lodash'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable, computed } from 'mobx'
import styled from 'styled-components'
import {
  DisplayText,
  SmallHelperText,
  Heading3,
  HugeNumber,
} from '~/ui/global/styled/typography'
import ChartGroup from '~/ui/global/charts/ChartGroup'
import { AboveChartContainer } from '~/ui/global/charts/ChartUtils'
import EditableButton from '~/ui/reporting/EditableButton'
import MeasureSelect from '~/ui/reporting/MeasureSelect'
import DataTargetButton from '~/ui/reporting/DataTargetButton'
import DataTargetSelect from '~/ui/reporting/DataTargetSelect'
import v from '~/utils/variables'
import trackError from '~/utils/trackError'
import OrganicGridPng from '~/assets/organic_grid_black.png'

const StyledDataItemCover = styled.div`
  background-color: ${v.colors.commonLight};
  border-top: 2px solid ${v.colors.black};
  height: calc(100% - 15px);
  padding: 15px 0 0;
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
@inject('uiStore', 'apiStore')
@observer
class DataItemCoverEditable extends React.Component {
  @observable
  targetCollection = null

  componentDidMount() {
    const { collectionFilter } = this.props.item
    if (collectionFilter && collectionFilter.target) {
      this.loadTargetCollection(collectionFilter.target)
    }
  }

  async loadTargetCollection(target) {
    const { apiStore } = this.props
    try {
      const res = await apiStore.fetch('collections', target)
      runInAction(() => {
        this.targetCollection = res.data
      })
    } catch (e) {
      trackError(e)
    }
  }

  @computed
  get editing() {
    const { card, uiStore } = this.props
    return uiStore.editingCardId === card.id
  }

  toggleEditing() {
    const { card, uiStore } = this.props
    uiStore.toggleEditingCardId(card.id)
  }

  onSelectTimeframe = value => {
    this.saveSettings({
      d_timeframe: value,
    })
  }

  onSelectTarget = value => {
    let collectionId = null
    if (value && value.internalType && value.internalType === 'collections') {
      collectionId = value.id
    } else if (value && value.custom) {
      collectionId = value.custom
    }

    this.saveSettings({
      d_filters: value
        ? [{ type: 'Collection', target: Number(collectionId) }]
        : [],
    })
    if (collectionId) {
      this.loadTargetCollection(collectionId)
    } else {
      runInAction(() => {
        this.targetCollection = null
      })
    }
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
    const { timeframe } = item
    const size = timeframe === 'ever' ? 1 : 2
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

  get timeframeControl() {
    const { item } = this.props
    const { timeframe } = item
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
          <span className="editableMetric">{timeframe}</span>
        </EditableButton>
      )
    }
    return <span>{timeframe}</span>
  }

  get measureControl() {
    const { item } = this.props
    const { measure } = item
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
          <span className="editableMetric">{measure.name}</span>
        </EditableButton>
      )
    }
    return <span>{measure.name}</span>
  }

  get targetControl() {
    const { item } = this.props
    const editable = item.can_edit_content

    if (this.editing) {
      return (
        <span className="editableMetric">
          <DataTargetSelect
            item={item}
            targetCollection={this.targetCollection}
            onSelect={this.onSelectTarget}
          />
        </span>
      )
    }
    return (
      <span className="editableMetric">
        <DataTargetButton
          targetCollection={this.targetCollection}
          editable={editable}
          onClick={this.handleEditClick}
        />
      </span>
    )
  }

  get collectionsAndItemsControls() {
    const { item } = this.props
    const { timeframe } = item
    if (timeframe === 'ever') {
      return (
        <span className="titleAndControls">
          within {!item.collectionFilter ? 'the ' : ''}
          {this.targetControl} {this.timeframeControl}
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

  get titleAndControls() {
    const { item } = this.props
    const { name, data_settings } = item
    if (item.isReportTypeNetworkAppMetric) {
      return startCase(data_settings.d_measure)
    } else if (item.isReportTypeCollectionsItems) {
      return this.collectionsAndItemsControls
    }
    return name
  }

  get primaryDataset() {
    const { datasets } = this.props.item
    if (datasets.length <= 1) return datasets[0]
    return datasets.find(dataset => dataset.primary)
  }

  renderSingleValue() {
    const { single_value } = this.primaryDataset ? this.primaryDataset : {}
    return (
      <Fragment>
        <Heading3>{this.measureControl}</Heading3>
        <HugeNumber className="count" data-cy="DataReport-count">
          {single_value}
        </HugeNumber>
        <SmallHelperText color={v.colors.black}>
          {this.titleAndControls}
        </SmallHelperText>
      </Fragment>
    )
  }

  renderTimeframeValues() {
    const { card, item } = this.props

    return (
      <Fragment>
        <AboveChartContainer>
          <DisplayText color={this.fillColor}>
            {this.titleAndControls}
          </DisplayText>
          <br />
        </AboveChartContainer>
        <ChartGroup
          datasets={item.datasets}
          width={card.width}
          height={card.height}
        />
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
        data-cy="DataItemCover"
      >
        {item.isReportTypeCollectionsItems && item.timeframe === 'ever'
          ? this.renderSingleValue()
          : this.renderTimeframeValues()}
      </StyledDataItemCover>
    )
  }
}

DataItemCoverEditable.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

DataItemCoverEditable.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCoverEditable
