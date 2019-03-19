import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { observable, action } from 'mobx'

import { DisplayText } from '~/ui/global/styled/typography'
import LineChartMeasure from '~/ui/icons/LineChartMeasure'

const StyledLegendItem = styled.div`
  border-top: 2px solid #000;
`

const Measure = styled.div`
  font-size: 1.1rem;
  margin-bottom: 5px;
`

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

@observer
class LegendItemCover extends React.Component {
  @observable
  @action
  toggleMeasure = async (measure, selected) => {
    const { item, card } = this.props
    const { selected_measures } = item.data_settings
    if (selected) {
      // Remove measure
      selected_measures.remove(measure)
    } else {
      // Add measure
      selected_measures.push(measure)
    }
    // item.data_settings.selected_measures = updatedMeasures
    await item.save()
    card.parent.API_fetchCards()
  }

  renderComparisonMeasures = ({ selected }) => {
    const { selected_measures } = this.props.item.data_settings
    if (selected && selected_measures.length === 0) return ''

    const { comparison_measures } = this.props.item
    const measures = comparison_measures.filter(
      measureData =>
        selected === selected_measures.includes(measureData.measure)
    )
    return measures.map(measureData =>
      this.renderMeasure({ measureData, primary: false, selected })
    )
  }

  renderMeasure = ({ measureData, primary, selected }) => {
    const { measure, style } = measureData
    let icon
    if (primary) {
      icon = <AreaChartMeasure color={style.fill || '#000000'} />
    } else if (selected) {
      icon = (
        <LineChartMeasure
          color={style.fill || '#000000'}
          order={measureData.order}
        />
      )
    }

    return (
      <Measure
        key={`measure-${measure}`}
        onClick={() => this.toggleMeasure(measure, selected)}
      >
        {icon && <MeasureIconWrapper>{icon}</MeasureIconWrapper>}
        <DisplayText>{measure}</DisplayText>
      </Measure>
    )
  }

  render() {
    const { item } = this.props
    const { primary_measure } = item
    return (
      <StyledLegendItem>
        <DisplayText>{item.name}</DisplayText>
        {this.renderMeasure({ measureData: primary_measure, primary: true })}
        {this.renderComparisonMeasures({ selected: true })}
        <br />
        <DisplayText>+ Add Comparison</DisplayText>
        <br />
        {this.renderComparisonMeasures({ selected: false })}
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
