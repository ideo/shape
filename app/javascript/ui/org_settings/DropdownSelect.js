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
import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
import HoverableDescriptionIcon from '../global/HoverableDescriptionIcon'

const currentValue = (record, options, fieldToUpdate) => {
  const object = _.find(options, option => option.id === record[fieldToUpdate])
  console.log('current value record in select dropdown: ', object)
  console.log(record, options, fieldToUpdate)
  if (object) return object.id
  return ''
}

const DropdownSelect = ({
  label,
  toolTip,
  record,
  options,
  fieldToUpdate,
  updateRecord,
}) => {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [previousValue, setPreviousValue] = useState('')
  const [selectedValue, setSelectedValue] = useState(
    currentValue(record, options, fieldToUpdate)
  )

  const isOpen = () => {
    return modalOpen ? 'confirm' : ''
  }

  const cancelSelection = () => {
    console.log('cancelling select: ', selectedValue)
    setSelectedValue(previousValue)
    setModalOpen(false)
  }

  const confirmSelection = () => {
    console.log('confirm select: ', selectedValue)
    const recordAttrs = {}
    recordAttrs[fieldToUpdate] = selectedValue
    console.log('confirm attrs: ', recordAttrs)
    updateRecord(recordAttrs)
    setModalOpen(false)
  }

  const updateSelectedValue = async e => {
    e.preventDefault()
    console.log('current selected value: ', selectedValue)
    console.log('attempting to update', e.target)
    setPreviousValue(selectedValue)
    setOpen(false)
    setSelectedValue(e.target.value)
    setModalOpen(true)
  }

  return (
    <div style={{ marginTop: '22px' }}>
      <ConfirmationDialog
        prompt={`You are about to change ${record.name ||
          record.name_display}'s ${label}. Would you like to Continue?`}
        onConfirm={() => confirmSelection()}
        onCancel={() => cancelSelection()}
        open={isOpen()}
        iconName="Alert"
      />
      <Label
        style={{
          fontSize: '13px',
          marginBottom: '11px',
        }}
        id={`${label}-select-label`}
      >
        {label}
        {toolTip && (
          <HoverableDescriptionIcon description={toolTip} width={16} />
        )}
      </Label>
      <Select
        labelid="subindustry-select-label"
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

DropdownSelect.propTypes = {
  label: PropTypes.string.isRequired,
  toolTip: PropTypes.string,
  record: PropTypes.object.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  fieldToUpdate: PropTypes.string.isRequired,
  updateRecord: PropTypes.func.isRequired,
}

export default DropdownSelect
