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
import InlineLoader from '~/ui/layout/InlineLoader'
import { AboveChartContainer } from '~/ui/global/charts/ChartUtils'
import EditableButton from '~/ui/reporting/EditableButton'
import MeasureSelect from '~/ui/reporting/MeasureSelect'
import DataTargetButton from '~/ui/reporting/DataTargetButton'
import DataTargetSelect from '~/ui/reporting/DataTargetSelect'
import v from '~/utils/variables'
import trackError from '~/utils/trackError'
import OrganicGridPng from '~/assets/organic_grid_black.png'
import { StyledDataItemCover } from '~/ui/grid/covers/data-item/StyledDataItemCover'

const GraphKey = styled.span`
  background: url(${OrganicGridPng});
  background-size: 150%;
  display: inline-block;
  height: 16px;
  margin-right: 10px;
  vertical-align: middle;
  width: 16px;
`

@inject('uiStore', 'apiStore')
@observer
class DataItemCoverCollectionsItems extends React.Component {
  @observable
  targetCollection = null
  @observable
  loading = false

  componentDidMount() {
    const {
      primaryDataset: { data_source_id },
    } = this.props.item
    if (data_source_id) {
      this.loadTargetCollection(data_source_id)
    }
  }

  async loadTargetCollection(id) {
    const { apiStore } = this.props
    try {
      const res = await apiStore.fetch('collections', id)
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
      timeframe: value,
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
      data_source_id: collectionId,
      data_source_type: 'Collection',
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
      measure: value,
    })
  }

  get correctGridSize() {
    const { item } = this.props
    const { timeframe } = item.primaryDataset
    const size = timeframe === 'ever' ? 1 : 2
    return { width: size, height: size }
  }

  async saveSettings(settings) {
    const { card, item, uiStore } = this.props
    runInAction(() => {
      Object.assign(item.primaryDataset, settings)
      this.loading = true
    })
    await item.primaryDataset.save()
    // If the timeframe changed we have to resize the card
    if (settings.timeframe) {
      const { height, width } = this.correctGridSize
      card.height = height
      card.width = width
      await card.save()
    }
    // TODO: investigate why data isn't being updated with just `save()`
    runInAction(() => {
      this.toggleEditing()
      uiStore.toggleEditingCardId(card.id)
      this.loading = false
    })
  }

  handleEditClick = ev => {
    const { card, item, uiStore } = this.props
    if (!item.can_edit_content) return
    uiStore.toggleEditingCardId(card.id)
  }

  get timeframeControl() {
    const { item } = this.props
    const { timeframe } = item.primaryDataset
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
    const { primaryDataset } = item
    const { measure } = primaryDataset
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
          <span className="editableMetric">{measure}</span>
        </EditableButton>
      )
    }
    return <span>{measure}</span>
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
    const { timeframe } = item.primaryDataset
    if (timeframe === 'ever') {
      return (
        <span className="titleAndControls">
          within {!item.datasets[0].data_source_id ? 'the ' : ''}
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
    const { name, primaryDataset } = item
    if (item.isReportTypeNetworkAppMetric) {
      return startCase(primaryDataset.measure)
    } else if (item.isReportTypeCollectionsItems) {
      return this.collectionsAndItemsControls
    }
    return name
  }

  renderSingleValue() {
    const { primaryDataset } = this.props.item
    const { single_value } = primaryDataset
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
          <DisplayText>{this.titleAndControls}</DisplayText>
          <br />
        </AboveChartContainer>
        <ChartGroup
          dataItem={item}
          simpleDateTooltip={!item.isReportTypeCollectionsItems}
          width={card.width}
          height={card.height}
        />
      </Fragment>
    )
  }

  render() {
    const { item, uiStore } = this.props
    const { timeframe } = item.primaryDataset

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
        {this.loading && <InlineLoader />}
        {item.isReportTypeCollectionsItems && timeframe === 'ever'
          ? this.renderSingleValue()
          : this.renderTimeframeValues()}
      </StyledDataItemCover>
    )
  }
}

DataItemCoverCollectionsItems.displayName = 'DataItemCoverCollectionsItems'

DataItemCoverCollectionsItems.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

DataItemCoverCollectionsItems.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCoverCollectionsItems
