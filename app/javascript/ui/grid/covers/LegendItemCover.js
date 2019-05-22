import _ from 'lodash'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { Select, SelectOption } from '~/ui/global/styled/forms'
import AutoComplete from '~/ui/global/AutoComplete'
import XIcon from '~/ui/icons/XIcon'
import PlusIcon from '~/ui/icons/PlusIcon'
import v from '~/utils/variables'
import { colorScale } from '~/ui/global/charts/ChartUtils'
import {
  DisplayText,
  Heading3,
  SmallHelperText,
} from '~/ui/global/styled/typography'
import LineChartIcon from '~/ui/icons/LineChartIcon'
import trackError from '~/utils/trackError'

function formatCollections(collections) {
  return collections.map(collection => ({
    value: collection.id,
    label: collection.name,
    data: collection,
  }))
}

const PlusIconContainer = styled.span`
  &:hover,
  &:active {
    .icon {
      background-color: ${v.colors.commonDarkest};
    }
    color: ${v.colors.commonDarkest};
  }
  .icon {
    background-color: ${v.colors.commonMedium};
    border-radius: 50%;
    padding: 7px;
    height: 15px;
    width: 15px;
    margin: -3px 8px 0 0;
    display: inline-block;
    vertical-align: middle;
  }
`

const StyledLegendItem = styled.div`
  border-top: 2px solid #000;
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
  display: inline-block;
  width: 100%;
  height: 100%;
  background-color: ${props => props.color};
`

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

  @observable
  @action
  toggleDatasetsWithName = async ({ name, selected }) => {
    const { parent } = this.props.card
    if (selected) {
      await parent.API_selectDatasetsWithName({ name })
    } else {
      await parent.API_unselectDatasetsWithName({ name })
    }
    parent.API_fetchCards()
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

  onDeselectComparison = async name => {
    this.toggleDatasetsWithName({ name: name, selected: false })
  }

  @action
  onSelectComparison = async testCollection => {
    const { card } = this.props
    await card.parent.API_addComparison(testCollection)
    card.parent.API_fetchCards()
  }

  findDatasetByTest(testId) {
    const { item } = this.props
    const dataSet = item.datasets.find(
      d => d.test_collection_id === parseInt(testId)
    )
    return dataSet
  }

  searchTestCollections = (term, callback) => {
    const { item, apiStore } = this.props
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
      .then(records => callback && callback(formatCollections(records)))
      .catch(e => {
        trackError(e)
      })
  }

  handleDatasetSelection = event => {
    event.preventDefault()
    const { value } = event.target
    this.toggleDatasetsWithName({ name: value, selected: true })
  }

  datasets = ({ selected }) => {
    const { datasets } = this.props.item
    const names = []
    return datasets.filter(dataset => {
      if (dataset.selected === selected && !_.includes(names, dataset.name)) {
        names.push(dataset.name)
        return true
      } else {
        return false
      }
    })
  }

  get renderDatasetsMenu() {
    return (
      <Select
        classes={{ root: 'select', selectMenu: 'selectMenu' }}
        displayEmpty
        disableUnderline
        name="role"
        onChange={this.handleDatasetSelection}
        onClose={() => this.setState({ comparisonMenuOpen: false })}
        open
        inline
      >
        {this.datasets({ selected: false }).map(dataset => (
          <SelectOption
            classes={{ root: 'selectOption', selected: 'selected' }}
            key={dataset.name}
            value={dataset.name}
          >
            {dataset.display_name}
          </SelectOption>
        ))}
      </Select>
    )
  }

  get renderTestCollectionsSearch() {
    return (
      <AutoComplete
        options={[]}
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

  renderSelectedDataset = ({ dataset }) => {
    if (!dataset) return ''
    const { name, style, chart_type, display_name, order } = dataset
    const primary = order === 0
    let icon
    if (chart_type === 'line') {
      icon = (
        <LineChartIcon
          color={(style && style.fill) || '#000000'}
          order={order}
        />
      )
    } else {
      const color = style && style.fill ? style.fill : colorScale[order]
      icon = <AreaChartIcon color={color} />
    }
    return (
      <Dataset key={`dataset-${name}`}>
        {icon && <DatasetIconWrapper>{icon}</DatasetIconWrapper>}
        <DatasetText color={v.colors.black}>{display_name}</DatasetText>
        {!primary &&
          dataset.class_type !== 'Dataset::OrgWideQuestion' && (
            <UnselectDataset
              role="button"
              onClick={() => this.onDeselectComparison(name)}
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
    return (
      <StyledLegendItem data-cy="LegendItemCover">
        <StyledLegendTitle>{item.name}</StyledLegendTitle>
        {this.datasets({ selected: true }).map(dataset =>
          this.renderSelectedDataset({
            dataset,
          })
        )}
        <br />
        <StyledAddComparison>
          {comparisonMenuOpen && this.renderComparisonMenu}
          {!comparisonMenuOpen && (
            <Heading3
              onClick={this.toggleComparisonSearch}
              role="button"
              className="test-add-comparison-button"
            >
              <PlusIconContainer>
                <PlusIcon viewBox="0 0 5 18" />
              </PlusIconContainer>
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
}

LegendItemCover.defaultProps = {
  card: null,
}

export default LegendItemCover
