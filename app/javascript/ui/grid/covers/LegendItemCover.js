import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { observable, action } from 'mobx'

import { Select, SelectOption } from '~/ui/global/styled/forms'
import XIcon from '~/ui/icons/XIcon'
import PlusIcon from '~/ui/icons/PlusIcon'
import v from '~/utils/variables'
import { DisplayText, Heading3 } from '~/ui/global/styled/typography'
import LineChartMeasure from '~/ui/icons/LineChartMeasure'

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

@observer
class LegendItemCover extends React.Component {
  state = {
    comparisonMenuOpen: false,
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

  comparisonMeasures = ({ selected }) => {
    const { selected_measures } = this.props.item.data_settings

    if (selected && selected_measures.length === 0) return []

    const { comparison_measures } = this.props.item
    return comparison_measures.filter(
      measureData =>
        selected === selected_measures.includes(measureData.measure)
    )
  }

  renderSelectedMeasure = ({ measureData, primary }) => {
    const { measure, style } = measureData
    let icon
    if (primary) {
      icon = <AreaChartMeasure color={(style && style.fill) || '#000000'} />
    } else {
      icon = (
        <LineChartMeasure
          color={(style && style.fill) || '#000000'}
          order={measureData.order}
        />
      )
    }
    return (
      <Measure key={`measure-${measure}`}>
        {icon && <MeasureIconWrapper>{icon}</MeasureIconWrapper>}
        <DisplayText>{measure}</DisplayText>
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

  toggleComparisonMenu = () => {
    const { comparisonMenuOpen } = this.state
    this.setState({
      comparisonMenuOpen: !comparisonMenuOpen,
    })
  }

  get comparisonMenuOptions() {
    return this.comparisonMeasures({ selected: false }).map(measureData => {
      const { measure } = measureData
      return measure
    })
  }

  handleComparisonMenuSelection = event => {
    event.preventDefault()
    const { value } = event.target
    this.toggleMeasure({ measure: value, show: true })
  }

  get renderComparisonMenu() {
    return (
      <Select
        classes={{ root: 'select', selectMenu: 'selectMenu' }}
        displayEmpty
        disableUnderline
        name="role"
        onChange={this.handleComparisonMenuSelection}
        onClose={() => this.setState({ comparisonMenuOpen: false })}
        open
        inline
      >
        {this.comparisonMenuOptions.map(option => (
          <SelectOption
            classes={{ root: 'selectOption', selected: 'selected' }}
            key={option}
            value={option}
          >
            {option}
          </SelectOption>
        ))}
      </Select>
    )
  }

  render() {
    const { item } = this.props
    const { primary_measure } = item
    const { comparisonMenuOpen } = this.state
    return (
      <StyledLegendItem>
        <StyledLegendTitle>{item.name}</StyledLegendTitle>
        {this.renderSelectedMeasure({
          measureData: primary_measure,
          primary: true,
        })}
        {this.comparisonMeasures({ selected: true }).map(measureData =>
          this.renderSelectedMeasure({
            measureData,
            primary: false,
          })
        )}
        <br />
        <StyledAddComparison>
          {comparisonMenuOpen && this.renderComparisonMenu}
          <Heading3
            onClick={this.toggleComparisonMenu}
            role="button"
            className="add-comparison-button"
          >
            <PlusIcon viewBox="0 0 5 18" />
            Add Comparison
          </Heading3>
        </StyledAddComparison>
      </StyledLegendItem>
    )
  }
}

LegendItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject,
}

LegendItemCover.defaultProps = {
  card: null,
}

export default LegendItemCover
