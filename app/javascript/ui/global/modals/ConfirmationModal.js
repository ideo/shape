import React from 'react'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import { FormActionsContainer, TextButton } from '~/ui/global/styled/forms'
import AlertModal from './AlertModal'

@observer
class ConfirmationModal extends React.Component {
  @observable isOpen = true

  handleCancel = (ev) => {
    ev.preventDefault()
    const { onCancel } = this.props
    if (!onCancel) return this.setOpen(false)
    return onCancel()
  }

  handleConfirm = (ev) => {
    ev.preventDefault()
    this.props.onConfirm()
    this.setOpen(false)
  }

  @action setOpen(val) {
    this.isOpen = val
  }

  render() {
    const {
      cancelText,
      confirmText,
      iconName,
      prompt,
    } = this.props
    return (
      <AlertModal open={this.isOpen} iconName={iconName} >
        <form>
          <p>
            { prompt }
          </p>
          <FormActionsContainer>
            <TextButton onClick={this.handleCancel}>
              {cancelText}
            </TextButton>
            <TextButton onClick={this.handleConfirm}>
              {confirmText}
            </TextButton>
          </FormActionsContainer>
        </form>
      </AlertModal>
    )
  }
}
ConfirmationModal.propTypes = {
  iconName: AlertModal.propTypes.iconName.isRequired,
  prompt: PropTypes.node.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
}
ConfirmationModal.defaultProps = {
  onCancel: null,
  confirmText: 'Roger',
  cancelText: 'Cancel',
}

export default ConfirmationModal
