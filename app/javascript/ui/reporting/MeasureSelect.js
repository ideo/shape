import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, runInAction, observable } from 'mobx'
import styled from 'styled-components'

import ArrowIcon from '~/ui/icons/ArrowIcon'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import { DATA_MEASURES } from '~/utils/variables'

const contentMeasureValues = ['collections', 'items', 'records']

const shownMeasures = DATA_MEASURES.filter(
  measure => contentMeasureValues.indexOf(measure.value) === -1
)

const contentMeasures = DATA_MEASURES.filter(
  measure => contentMeasureValues.indexOf(measure.value) !== -1
)

const timeframeMeasures = [
  { name: 'month', value: 'month' },
  { name: 'week', value: 'week' },
  { name: 'ever', value: 'ever' },
]

const IconHolder = styled.span`
  display: inline-block;
  height: 15px;
  position: absolute;
  right: 15px;
  transform: rotate(${props => (props.open ? '270deg' : '180deg')});
  transition: transform 0.35s;
  top: calc(50% - 6px);
  width: 10px;
`

@observer
class MeasureSelect extends React.Component {
  @observable
  menuOpen = false

  @observable
  contentSectionOpen = false

  get currentValue() {
    const { item, dataSettingsName } = this.props
    if (!item) return null
    return item.data_settings[`d_${dataSettingsName}`]
  }

  get contentSelected() {
    return contentMeasureValues.indexOf(this.currentValue) !== -1
  }

  @action
  toggleContentSection() {
    this.contentSectionOpen = !this.contentSectionOpen
  }

  handleOpen = ev => {
    runInAction(() => (this.menuOpen = true))
  }

  handleClose = ev => {
    runInAction(() => (this.menuOpen = false))
  }

  handleChange = ev => {
    ev.preventDefault()
    if (ev.target.value === 'contentMenu') {
      this.toggleContentSection()
      runInAction(() => (this.menuOpen = true))
      return
    }
    const { onSelect } = this.props
    if (onSelect) onSelect(ev.target.value)
    runInAction(() => (this.menuOpen = false))
  }

  get measures() {
    const { dataSettingsName } = this.props
    if (dataSettingsName === 'timeframe') return timeframeMeasures
    if (dataSettingsName === 'measure') {
      const measures = [
        { name: 'Select Measure...', value: null },
        ...shownMeasures,
        { name: 'Content', value: 'contentMenu' },
      ]
      if (this.contentSectionOpen || this.contentSelected) {
        measures.push(...contentMeasures)
      }
      return measures
    }
    return []
  }

  render() {
    return (
      <form className="form" style={{ display: 'inline-block' }}>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.handleChange}
          onOpen={this.handleOpen}
          onClose={this.handleClose}
          value={this.currentValue}
          inline
          open={this.menuOpen}
        >
          {this.measures.map(opt => (
            <SelectOption
              classes={{ root: 'selectOption', selected: 'selected' }}
              key={opt.value}
              value={opt.value}
              disabled={opt.value === 'contentMenu' && this.contentSelected}
            >
              {opt.name}
              {opt.value === 'contentMenu' && (
                <IconHolder
                  open={this.contentSectionOpen || this.contentSelected}
                >
                  <ArrowIcon />
                </IconHolder>
              )}
            </SelectOption>
          ))}
        </Select>
      </form>
    )
  }
}

MeasureSelect.propTypes = {
  dataSettingsName: PropTypes.string.isRequired,
  item: MobxPropTypes.objectOrObservableObject,
  onSelect: PropTypes.func,
}

MeasureSelect.defaultProps = {
  item: null,
  onSelect: null,
}

export default MeasureSelect
