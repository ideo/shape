import PropTypes from 'prop-types'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import _ from 'lodash'

import { Select, SelectOption } from '~/ui/global/styled/forms'
import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
// import HoverableDescriptionIcon from '../global/HoverableDescriptionIcon'
// import TruncatableText from '../global/TruncatableText'

const currentValue = (record, options, fieldToUpdate) => {
  const object = _.find(options, option => option.id === record[fieldToUpdate])

  if (object) return object.id
  return ''
}

const DropdownSelect = ({
  label,
  // toolTip,
  record,
  options,
  fieldToUpdate,
  updateRecord,
  objectToUpdateName,
  ...additionalProps
}) => {
  const value = currentValue(record, options, fieldToUpdate)

  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [previousValue, setPreviousValue] = useState('')
  const [selectedValue, setSelectedValue] = useState(value)

  const isOpen = () => {
    return modalOpen ? 'confirm' : ''
  }

  const cancelSelection = () => {
    setSelectedValue(previousValue)
    setModalOpen(false)
  }

  const confirmSelection = () => {
    const recordAttrs = {}
    recordAttrs[fieldToUpdate] = selectedValue
    updateRecord(recordAttrs)
    setModalOpen(false)
  }

  const updateSelectedValue = async e => {
    e.preventDefault()
    setPreviousValue(selectedValue)
    setOpen(false)
    setSelectedValue(e.target.value)
    setModalOpen(true)
  }

  return (
    // Should this really be setting margin?
    // Shouldn't its parent or container do that?
    <React.Fragment>
      <ConfirmationDialog
        prompt={`You are about to change ${record.name ||
          record.name_display ||
          objectToUpdateName}
          's ${label}. Would you like to Continue?`}
        onConfirm={() => confirmSelection()}
        onCancel={() => cancelSelection()}
        onClose={() => setModalOpen(false)}
        open={isOpen()}
        iconName="Alert"
      />
      <Select
        {...additionalProps}
        style={{ width: '244px' }}
        labelid={`${label.split(' ').join('')}-select-label`}
        classes={{
          root: 'select',
          selectMenu: 'selectMenu bottomPadded',
        }}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={e => updateSelectedValue(e)}
        value={selectedValue}
        open={open}
      >
        {/* TODO: deal with placeholder if org has no subcategory */}
        {options.map(option => (
          <SelectOption
            classes={{
              root: 'selectOption',
              selected: 'selected',
            }}
            key={uuidv4()}
            value={option.id}
          >
            {option.name}
          </SelectOption>
        ))}
      </Select>
    </React.Fragment>
  )
}

DropdownSelect.propTypes = {
  label: PropTypes.string.isRequired,
  // toolTip: PropTypes.string,
  record: PropTypes.object.isRequired,
  objectToUpdateName: PropTypes.string.isRequired,
  // TODO: fix these to use MobxPropTypes
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  fieldToUpdate: PropTypes.string.isRequired,
  updateRecord: PropTypes.func.isRequired,
}

DropdownSelect.defaultPropTypes = {
  toolTip: '',
}

export default DropdownSelect
