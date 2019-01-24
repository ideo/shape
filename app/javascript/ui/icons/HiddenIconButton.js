import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore } from '~/stores'
import Tooltip from '~/ui/global/Tooltip'
import HiddenIcon from './HiddenIcon'
import HiddenIconSm from './HiddenIconSm'

const HiddenIconButton = ({ record, size, clickable, IconWrapper }) => {
  const parent = record.parent || uiStore.viewingCollection
  const parentName = parent ? parent.name : 'the collection'
  let tooltipText, onClick
  if (!record.isSubmission) {
    let infoText = `This ${
      record.internalType === 'items' ? 'item' : 'collection'
    } is hidden from some people with access to "${parentName}".`
    tooltipText = infoText
    if (record.can_edit && clickable) {
      tooltipText += ' Click to restore permissions.'
      infoText += ` Restore permissions from "${parentName}"?`
      onClick = () => {
        if (!record.can_edit) return
        uiStore.confirm({
          iconName: 'Hidden',
          prompt: infoText,
          confirmText: 'Restore',
          onConfirm: () => {
            record.API_restorePermissions()
          },
        })
      }
    }
  } else {
    tooltipText = 'Your submission is hidden.'
    if (clickable) {
      tooltipText += ' Click to make it visible to others.'
      onClick = () => record.API_submitSubmission()
    }
  }
  const Icon = size === 'sm' ? HiddenIconSm : HiddenIcon
  let wrappedIcon = (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={tooltipText}
      placement="top"
    >
      {/* Tooltip requires an immediate normal child that is ref-able */}
      <div>
        <Icon />
      </div>
    </Tooltip>
  )
  if (IconWrapper) {
    wrappedIcon = <IconWrapper>{wrappedIcon}</IconWrapper>
  }
  return (
    <button style={{ display: 'block' }} onClick={onClick}>
      {wrappedIcon}
    </button>
  )
}

HiddenIconButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  size: PropTypes.string,
  clickable: PropTypes.bool,
  IconWrapper: PropTypes.func,
}
HiddenIconButton.defaultProps = {
  size: 'sm',
  clickable: false,
  IconWrapper: null,
}

export default HiddenIconButton
