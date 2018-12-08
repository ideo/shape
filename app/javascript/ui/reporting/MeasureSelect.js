import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import MenuItem from '@material-ui/core/MenuItem'

import { Select } from '~/ui/global/styled/forms'

const dataOptions = {
  measure: [
    { name: 'Select Measure...', value: null },
    { name: 'Participants', value: 'participants' },
    { name: 'Viewers', value: 'viewers' },
    { name: 'Activity', value: 'activity' },
  ],
  timeframe: [
    { name: 'month', value: 'month' },
    { name: 'week', value: 'week' },
    { name: 'ever', value: 'ever' },
  ],
}

class MeasureSelect extends React.Component {
  get currentValue() {
    const { item, dataSettingsName } = this.props
    if (!item) return null
    return item.data_settings[`d_${dataSettingsName}`]
  }

  handleChange = ev => {
    ev.preventDefault()
    const { onSelect } = this.props
    if (onSelect) onSelect(ev.target.value)
  }

  render() {
    const { dataSettingsName } = this.props
    return (
      <form className="form" style={{ display: 'inline-block' }}>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.handleChange}
          value={this.currentValue}
          inline
        >
          {dataOptions[dataSettingsName].map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.name}
            </MenuItem>
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
