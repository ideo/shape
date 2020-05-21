import _ from 'lodash'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { Select, SelectOption } from '~/ui/global/styled/forms'
import AutoComplete from '~/ui/global/AutoComplete'
import XIcon from '~/ui/icons/XIcon'
import v from '~/utils/variables'
import { colorScale, darkenColor } from '~/ui/global/charts/ChartUtils'
import {
  DisplayText,
  Heading3,
  SmallHelperText,
} from '~/ui/global/styled/typography'
import LineChartIcon from '~/ui/icons/LineChartIcon'
import trackError from '~/utils/trackError'

function formatForAutocomplete(objects) {
  return objects.map(object => ({
    value: object.id,
    label: object.name,
    data: object,
  }))
}

const PlusIconContainer = styled.span`
  display: inline-block;
  vertical-align: middle;
  font-size: 1.3em;
  margin-right: 6px;
  margin-top: -3px;
`

const StyledLegendItem = styled.div`
  border-top: 2px solid #000;
  ${props =>
    props.hasSearchInterface
      ? `
    overflow: visible;
  `
      : `
    overflow-y: scroll;
  `}
  padding: 12px 15px 12px 10px;
`

const StyledLegendTitle = styled(Heading3)`
  display: block;
  margin-bottom: 20px;
`

const Dataset = styled.div`
  font-size: 1.1rem;
  margin: 15px 0;
  position: relative;
`
Dataset.displayName = 'Dataset'

const UnselectDataset = styled(DisplayText)`
  position: absolute;
  right: 0;
  width: 16px;
  color: ${v.colors.commonDark};
  transition: color 150ms;
  &:hover,
  &:active {
    color: black;
  }
`
UnselectDataset.displayName = 'UnselectDataset'

const AreaChartIcon = styled.span`
  opacity: 0.8;
  display: inline-block;
  width: 100%;
  height: 100%;
  background-color: ${props => props.color};
`
AreaChartIcon.displayName = 'AreaChartIcon'

const DatasetIconWrapper = styled.span`
  display: inline-block;
  width: 15px;
  height: 15px;
  margin: 0 7px 0 5px;
`

const StyledAddComparison = styled.div`
  position: relative;
  > div {
    display: inline-block;
  }
  &:hover,
  &:active {
    color: ${v.colors.commonDarkest};
  }
`

const DatasetText = styled(SmallHelperText)`
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 240px;
  white-space: nowrap;
  @media only screen and (max-width: ${v.responsive.largeBreakpoint}px) {
    width: 200px;
  }
`

@inject('apiStore', 'uiStore')
@observer
class LegendItemCover extends React.Component {
  state = {
    comparisonMenuOpen: false,
  }

  componentDidMount() {
    this.searchTestCollections(' ')
  }

  componentWillUnMount() {
    const { uiStore } = this.props
    uiStore.removeEmptySpaceClickHandler(this.onSearchClose)
  }

  usesTestComparisonApi(entity) {
    const isTestCollection = entity.internalType === 'collections'
    // If it is a test collection, it uses the test comparison api
    if (isTestCollection) return true
    // If not a dataset, does not use test comparison API
    if (!entity.internalType === 'datasets') return false
    const hasGroupings = entity.groupings && entity.groupings.length
    // Uses test comparison API if it references a test collection,
    // and does not have any groupings
    return entity.test_collection_id && !hasGroupings
  }

  rendersAsLine(selectedDataset, isPrimary) {
    if (selectedDataset.chart_type === 'line') return true
    const isSecondaryAreaChart =
      selectedDataset.chart_type === 'area' && !isPrimary
    if (isSecondaryAreaChart) {
      if (!selectedDataset.hasDates || selectedDataset.tiers.length) {
        return true
      }
    }
    return false
  }

  /*
   * Unique dataset and whether selected or not
   */
  datasets = ({ selected }) => {
    const { datasets } = this.props.item
    const identifiers = []
    return datasets.filter(dataset => {
      if (
        dataset.selected === selected &&
        !_.includes(identifiers, dataset.identifier)
      ) {
        identifiers.push(dataset.identifier)
        return true
      } else {
        return false
      }
    })
  }

  get parent() {
    return this.props.card.parentCollection
  }

  /*
   * Toggle's a dataset that already exists on the legend items and charts
   * to have it's data_items_dataset.selected property toggled
   */
  @observable
  @action
  toggleDatasetsWithIdentifier = async ({ identifier, selected }) => {
    const { parent } = this
    if (!selected) {
      await parent.API_selectDatasetsWithIdentifier({ identifier })
    } else {
      await parent.API_unselectDatasetsWithIdentifier({ identifier })
    }
    parent.API_fetchCards({ include: ['datasets'] })
  }

  toggleComparisonSearch = () => {
    const { uiStore } = this.props
    const { comparisonMenuOpen } = this.state
    if (comparisonMenuOpen) {
      uiStore.removeEmptySpaceClickHandler(this.onSearchClose)
    } else {
      uiStore.addEmptySpaceClickHandler(this.onSearchClose)
    }
    this.setState({
      comparisonMenuOpen: !comparisonMenuOpen,
    })
  }

  onSearchClose = ev => {
    this.setState({
      comparisonMenuOpen: false,
    })
  }

  /*
   * When de-selecting a comparison with the Unselect button. Will always
   * pass in a dataset and will either toggle the dataset's selected property
   * if it's a grouped dataset (for now) or remove the whole data_items_dataset
   *
   * Datasets with groupings should always remain on the legend item and
   * chart items so they appear by default in the add comparisons search menu.
   * This behavior may change in the future
   */
  onDeselectComparison = async dataset => {
    const { parent } = this
    if (this.usesTestComparisonApi(dataset)) {
      await parent.API_removeComparison({ id: dataset.test_collection_id })
    } else {
      const { identifier, selected } = dataset
      this.toggleDatasetsWithIdentifier({ identifier, selected })
    }
    parent.API_fetchCards()
  }

  /*
   * When selecting a comparison with the autocomplete search. Will pass in
   * either a dataset, in the case of org-wide and test audiences, or a
   * TestCollection, in the case of the collection search.
   *
   * Datasets with groupings should always remain on the legend item and
   * chart items so they appear by default in the add comparisons search menu.
   * This behavior may change in the future
   */
  onSelectComparison = async entity => {
    const { parent } = this
    if (this.usesTestComparisonApi(entity)) {
      await parent.API_addComparison(entity)
    } else {
      const { identifier, selected } = entity
      this.toggleDatasetsWithIdentifier({ identifier, selected })
    }
    parent.API_fetchCards()
  }

  findDatasetByTest(testId) {
    const { item } = this.props
    const dataSet = item.datasets.find(
      d => d.data_source_id === parseInt(testId)
    )
    return dataSet
  }

  searchTestCollections = (term, callback) => {
    const { item, apiStore } = this.props
    if (!apiStore.currentUser) {
      return
    }
    if (!term) {
      callback()
      return
    }
    return apiStore
      .searchCollections({
        query: `${term}`,
        type: 'Collection::TestCollection',
        order_by: 'updated_at',
        order_direction: 'desc',
        per_page: 30,
      })
      .then(res => res.data)
      .then(records => records.filter(record => record.id !== item.parent_id))
      .then(records =>
        records.filter(record => !this.findDatasetByTest(record.id))
      )
      .then(records => callback && callback(formatForAutocomplete(records)))
      .catch(e => {
        trackError(e)
      })
  }

  handleUnselectedDatasetOption = event => {
    event.preventDefault()
    const { value } = event.target
    this.toggleDatasetsWithIdentifier({ identifier: value, selected: false })
  }

  get renderDatasetsMenu() {
    return (
      <Select
        classes={{ root: 'select', selectMenu: 'selectMenu' }}
        displayEmpty
        disableUnderline
        name="role"
        onChange={this.handleUnselectedDatasetOption}
        onClose={() => this.setState({ comparisonMenuOpen: false })}
        open
        inline
      >
        {this.datasets({ selected: false }).map(dataset => (
          <SelectOption
            classes={{ root: 'selectOption', selected: 'selected' }}
            key={dataset.identifier}
            value={dataset.identifier}
          >
            {dataset.name}
          </SelectOption>
        ))}
      </Select>
    )
  }

  get renderTestCollectionsSearch() {
    // Transform the audience so name is set to display name for the option
    // formatting
    const selectedDatasetIdentifiers = this.datasets({ selected: true }).map(
      d => d.identifier
    )
    const unselectedDatasets = this.datasets({ selected: false })
    const formattedOptions = formatForAutocomplete(
      _.reject(unselectedDatasets, unselected =>
        _.includes(selectedDatasetIdentifiers, unselected.identifier)
      )
    )
    return (
      <AutoComplete
        defaultOptions={formattedOptions}
        optionSearch={this.searchTestCollections}
        onOptionSelect={option => this.onSelectComparison(option)}
        placeholder="search comparisons"
        onMenuClose={this.onSearchClose}
      />
    )
  }

  get renderComparisonMenu() {
    const { legend_search_source } = this.props.item
    if (legend_search_source === 'select_from_datasets') {
      return this.renderDatasetsMenu
    } else if (legend_search_source === 'search_test_collections') {
      return this.renderTestCollectionsSearch
    }
  }

  renderSelectedDataset = ({ dataset, order, colorOrder }) => {
    if (!dataset) return ''
    const { identifier, name, style } = dataset
    const primary = order === 0
    let icon
    const { item } = this.props
    const itemStyle = item.style
    let renderedColor =
      style && style.fill
        ? darkenColor(style.fill, colorOrder)
        : colorScale[order]
    // Style on the item itself should aways override dataset style.
    if (itemStyle && itemStyle.fill) {
      renderedColor = itemStyle.fill
    }
    if (this.rendersAsLine(dataset, primary)) {
      icon = <LineChartIcon color={renderedColor} order={order} />
    } else {
      icon = (
        <AreaChartIcon
          color={renderedColor}
          isPrimary={primary}
          data-dataset-id={dataset.id}
        />
      )
    }
    return (
      <Dataset key={`dataset-${identifier}`}>
        {icon && <DatasetIconWrapper>{icon}</DatasetIconWrapper>}
        <DatasetText color={v.colors.black}>{name}</DatasetText>
        {!primary && dataset.selected && (
          <UnselectDataset
            role="button"
            onClick={() => this.onDeselectComparison(dataset)}
          >
            <XIcon />
          </UnselectDataset>
        )}
      </Dataset>
    )
  }

  render() {
    const { item } = this.props
    const { comparisonMenuOpen } = this.state
    let order = -1
    let colorOrder = -1
    return (
      <StyledLegendItem
        data-cy="LegendItemCover"
        hasSearchInterface={
          item.legend_search_source === 'search_test_collections'
        }
      >
        <StyledLegendTitle>{item.name}</StyledLegendTitle>
        {this.datasets({ selected: true }).map(dataset => {
          if (dataset.hasDates) colorOrder += 1
          return this.renderSelectedDataset({
            dataset,
            order: (order += 1),
            colorOrder,
          })
        })}
        <br />
        <StyledAddComparison>
          {comparisonMenuOpen && this.renderComparisonMenu}
          {!comparisonMenuOpen && (
            <Heading3
              onClick={this.toggleComparisonSearch}
              role="button"
              className="test-add-comparison-button"
            >
              <PlusIconContainer>+</PlusIconContainer>
              Add Comparison
            </Heading3>
          )}
        </StyledAddComparison>
      </StyledLegendItem>
    )
  }
}

LegendItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject,
}

LegendItemCover.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

LegendItemCover.defaultProps = {
  card: null,
}

export default LegendItemCover
