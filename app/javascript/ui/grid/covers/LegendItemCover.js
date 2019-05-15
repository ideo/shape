import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { observable, action } from 'mobx'

import AutoComplete from '~/ui/global/AutoComplete'
import XIcon from '~/ui/icons/XIcon'
import PlusIcon from '~/ui/icons/PlusIcon'
import v from '~/utils/variables'
import { colorScale } from '~/ui/global/charts/ChartUtils'
import { DisplayText, Heading3 } from '~/ui/global/styled/typography'
import LineChartMeasure from '~/ui/icons/LineChartMeasure'
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

const Measure = styled.div`
  font-size: 1.1rem;
  margin: 15px 0;
  position: relative;
`
Measure.displayName = 'Measure'

const UnselectMeasure = styled(DisplayText)`
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
UnselectMeasure.displayName = 'UnselectMeasure'

const AreaChartMeasure = styled.span`
  display: inline-block;
  width: 100%;
  height: 100%;
  background-color: ${props => props.color};
`

const MeasureIconWrapper = styled.span`
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

@inject('apiStore', 'uiStore')
@observer
class LegendItemCover extends React.Component {
  state = {
    comparisonMenuOpen: false,
  }

  componentWillUnMount() {
    const { uiStore } = this.props
    uiStore.removeEmptySpaceClickHandler(this.onSearchClose)
  }

  @observable
  @action
  toggleMeasure = async ({ measure, show }) => {
    const { item, card } = this.props
    const { selected_measures } = item.data_settings
    if (show) {
      // Add measure
      selected_measures.push(measure)
    } else {
      // Remove measure
      selected_measures.remove(measure)
    }
    await item.save()
    card.parent.API_fetchCards()
  }

  renderSelectedDataset = ({ dataset, order, primary }) => {
    const { measure, style, chart_type } = dataset
    let icon
    if (chart_type === 'line') {
      icon = (
        <LineChartMeasure
          color={(style && style.fill) || '#000000'}
          order={order}
        />
      )
    } else {
      const color = style && style.fill ? style.fill : colorScale[order]
      icon = <AreaChartMeasure color={color} />
    }
    return (
      <Measure key={`measure-${measure}`}>
        {icon && <MeasureIconWrapper>{icon}</MeasureIconWrapper>}
        <DisplayText>{this.measureDisplayName(measure)}</DisplayText>
        {!primary && (
          <UnselectMeasure
            role="button"
            onClick={() => this.toggleMeasure({ measure, show: false })}
          >
            <XIcon />
          </UnselectMeasure>
        )}
      </Measure>
    )
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

  measureDisplayName = measure => {
    const { dynamic_measure_names } = this.props.item
    const dynamicName = dynamic_measure_names
      ? dynamic_measure_names[measure]
      : undefined
    if (dynamicName) return dynamicName
    return measure
  }

  onSearchClose = ev => {
    this.setState({
      comparisonMenuOpen: false,
    })
  }

  onSelectComparison = testCollection => {
    const { card } = this.props
    console.log('woah', card)
    card.parent.API_addComparison(testCollection)
  }

  searchTestCollections = (term, callback) => {
    const { item, apiStore } = this.props
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
      .then(records => callback(formatCollections(records)))
      .catch(e => {
        trackError(e)
      })
  }

  get renderComparisonMenu() {
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

  render() {
    const { item } = this.props
    const { primaryDataset } = item
    const { comparisonMenuOpen } = this.state
    let order = 0
    return (
      <StyledLegendItem data-cy="LegendItemCover">
        <StyledLegendTitle>{item.name}</StyledLegendTitle>
        {this.renderSelectedDataset({
          dataset: primaryDataset,
          order: order,
          primary: true,
        })}
        {item.secondaryDatasets({ selected: true }).map(dataset =>
          this.renderSelectedDataset({
            dataset,
            order: (order += 1),
            primary: false,
          })
        )}
        <br />
        <StyledAddComparison>
          {comparisonMenuOpen && this.renderComparisonMenu}
          {!comparisonMenuOpen && (
            <Heading3
              onClick={this.toggleComparisonSearch}
              role="button"
              className="add-comparison-button"
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
