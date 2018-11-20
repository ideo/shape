import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import MenuItem from '@material-ui/core/MenuItem'

import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import { Select } from '~/ui/global/styled/forms'

const measureOptions = [
  { name: 'Select Measure...', value: null },
  { name: 'Participants', value: 'participants' },
  { name: 'Viewers', value: 'viewers' },
]

class MeasureSelect extends React.Component {
  get currentValue() {
    const { item } = this.props
    if (!item) return null
    return item.data_settings.d_measure
  }

  handleChange = ev => {
    ev.preventDefault()
    const { onSelect } = this.props
    if (onSelect) onSelect(ev.target.value)
  }

  render() {
    return (
      <form className="form">
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.handleChange}
          value={this.currentValue}
        >
          {measureOptions.map(opt => (
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
  item: MobxPropTypes.objectOrObservableObject,
  onSelect: PropTypes.func,
}

MeasureSelect.defaultProps = {
  item: null,
  onSelect: null,
}

export default MeasureSelect
