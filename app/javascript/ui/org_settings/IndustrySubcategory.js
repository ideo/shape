import PropTypes from 'prop-types'
import { useState } from 'react'
import _ from 'lodash'

import {
  // LabelContainer,
  Select,
  SelectOption,
  Label,
  // LabelTextStandalone,
  // LabelHint,
} from '~/ui/global/styled/forms'

const IndustrySubcategorySelectField = ({
  record,
  options,
  handleChange,
  fieldToUpdate,
}) => {
  const [open, setOpen] = useState(false)

  const currentValue = () => {
    const industry = _.find(
      options,
      option => option.id === record[fieldToUpdate]
    )
    if (industry) return industry.id
    return undefined
  }

  return (
    <div>
      <Label style={{ fontSize: '13px' }} id="subindustry-select-label">
        Industry
      </Label>
      <Select
        labelId="subindustry-select-label"
        classes={{
          root: 'select',
          selectMenu: 'selectMenu',
        }}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={e => handleChange(e)}
        value={currentValue()}
        open={open}
        inline
      >
        {/* TODO: deal with placeholder if org has no subcategory */}
        {options.map(option => (
          <SelectOption
            classes={{
              root: 'selectOption',
              selected: 'selected',
            }}
            key={option.id} // TODO: need actual unique key here?
            value={option.id}
          >
            {option.name}
          </SelectOption>
        ))}
      </Select>
    </div>
  )
}

IndustrySubcategorySelectField.defaultProps = {
  record: {},
  options: [],
  fieldToUpdate: '',
  handleChange: () => null,
}
IndustrySubcategorySelectField.propTypes = {
  record: PropTypes.object, // TODO: make record to it can be a business unit
  options: PropTypes.arrayOf(PropTypes.object), // TODO: make options so it can be content versions
  fieldToUpdate: PropTypes.string, // TODO: provide field for record to update on change
  handleChange: PropTypes.func, // to update record on change
}

export default IndustrySubcategorySelectField
