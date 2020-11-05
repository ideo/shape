import _ from 'lodash'
import PropTypes from 'prop-types'
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
import { debouncedAutocompleteSearch } from '~/ui/reporting/utils'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'
import OrganicGridPng from '~/assets/organic_grid_black.png'
import { StyledDataItemCover } from '~/ui/grid/covers/data-item/StyledDataItemCover'
import DataItemGroupingControl from '~/ui/grid/covers/data-item/DataItemGroupingControl'
import v, { DATA_MEASURES } from '~/utils/variables'

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
  loading = false
  @observable
  changingTimeframe = false

  constructor(props) {
    super(props)
    this.debouncedGroupSearch = debouncedAutocompleteSearch('searchGroups')
  }

  componentDidMount() {
    const { item, uiStore } = this.props
    if (uiStore.isNewCard(item.id)) {
      uiStore.removeNewCard(item.id)
      this.toggleEditing()
    }
  }

  @computed
  get editing() {
    const { card, uiStore } = this.props
    return uiStore.editingCardCover === card.id
  }

  toggleEditing() {
    const { card, uiStore } = this.props
    if (this.editing) {
      uiStore.setEditingCardCover(null)
    } else {
      uiStore.setEditingCardCover(card.id)
    }
  }

  onSelectTimeframe = value => {
    this.saveSettings({
      timeframe: value,
    })
  }

  onSelectTarget = value => {
    const { loadTargetCollection } = this.props
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
    // if collectionId is null it will unset targetCollection
    loadTargetCollection(collectionId)
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

  saveSettings = async settings => {
    const { card, item } = this.props
    const { primaryDataset } = item
    runInAction(() => {
      Object.assign(primaryDataset, settings)
      this.loading = true
      if (settings.timeframe) {
        this.changingTimeframe = true
      }
      if (settings.groupings && _.isEmpty(settings.groupings)) {
        primaryDataset.group = null
      }
    })
    await primaryDataset.patch()

    // If the timeframe changed we have to resize the card
    if (settings.timeframe) {
      const { height, width } = this.correctGridSize
      if (card.height !== height || card.width !== width) {
        card.height = height
        card.width = width
        await card.patch()
      }
    }
    // TODO: investigate why data isn't being updated with just `save()`
    runInAction(() => {
      this.toggleEditing()
      this.loading = false
      this.changingTimeframe = false
    })
  }

  handleEditClick = ev => {
    const { item } = this.props
    if (!item.can_edit_content) return
    this.toggleEditing()
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

  renderInfoIconTooltip = metric => {
    const measure = _.find(DATA_MEASURES, measure => measure.value === metric)
    return <HoverableDescriptionIcon description={measure.description} />
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
          {this.renderInfoIconTooltip(measure)}
        </EditableButton>
      )
    }
    return (
      <span>
        {measure}
        {this.renderInfoIconTooltip(measure)}
      </span>
    )
  }

  get targetControl() {
    const { item, targetCollection } = this.props
    const editable = item.can_edit_content

    if (this.editing) {
      return (
        <span className="editableMetric">
          <DataTargetSelect
            item={item}
            targetCollection={targetCollection}
            onSelect={this.onSelectTarget}
          />
        </span>
      )
    }
    return (
      <span className="editableMetric">
        <DataTargetButton
          targetCollection={targetCollection}
          editable={editable}
          onClick={this.handleEditClick}
        />
      </span>
    )
  }

  onGroupSearch = (value, callback) =>
    this.debouncedGroupSearch(value, callback)

  get groupingControl() {
    const { item } = this.props
    const { can_edit_content } = item
    const { group } = item.primaryDataset

    return (
      <DataItemGroupingControl
        group={group}
        canEdit={can_edit_content}
        editing={this.editing}
        onEditClick={this.handleEditClick}
        saveSettings={this.saveSettings}
      />
    )
  }

  get collectionsAndItemsControls() {
    const { item } = this.props
    const { primaryDataset } = item
    const { timeframe } = primaryDataset
    if (timeframe === 'ever') {
      return (
        <span className="titleAndControls">
          within {!primaryDataset.data_source_id ? 'the ' : ''}
          {this.targetControl}
          {this.groupingControl} {this.timeframeControl}
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
          {this.groupingControl}
        </SmallHelperText>
      </Fragment>
    )
  }

  get titleAndControls() {
    const { item } = this.props
    const { name, primaryDataset } = item
    if (item.isReportTypeNetworkAppMetric) {
      return _.startCase(primaryDataset.measure)
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
          {single_value ? single_value.toLocaleString() : ''}
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
    const { item } = this.props
    const { primaryDataset } = item

    let contents
    if (!this.changingTimeframe && primaryDataset) {
      // during load the primaryDataset may be changing types so we don't want to render the wrong type
      if (
        item.isReportTypeCollectionsItems &&
        primaryDataset.timeframe === 'ever'
      ) {
        contents = this.renderSingleValue()
      } else {
        contents = this.renderTimeframeValues()
      }
    } else {
      contents = <InlineLoader />
    }

    return (
      <StyledDataItemCover
        className="cancelGridClick"
        editable={item.can_edit_content}
        editing={this.editing}
        data-cy="DataItemCover"
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      >
        {this.loading && primaryDataset && <InlineLoader />}
        {contents}
      </StyledDataItemCover>
    )
  }
}

DataItemCoverCollectionsItems.displayName = 'DataItemCoverCollectionsItems'

DataItemCoverCollectionsItems.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  targetCollection: MobxPropTypes.objectOrObservableObject,
  loadTargetCollection: PropTypes.func.isRequired,
}

DataItemCoverCollectionsItems.defaultProps = {
  targetCollection: null,
}

DataItemCoverCollectionsItems.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCoverCollectionsItems
