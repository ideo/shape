import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { FormActionsContainer, TextButton } from '~/ui/global/styled/forms'
import AlertModal from './AlertModal'

@inject('uiStore')
@observer
class ConfirmationModal extends React.Component {
  close() {
    this.props.uiStore.closeAlertModal()
  }

  handleCancel = (ev) => {
    ev.preventDefault()
    const { onCancel } = this.props
    if (!onCancel) return this.close()
    return onCancel()
  }

  handleConfirm = (ev) => {
    ev.preventDefault()
    this.props.onConfirm()
    this.close()
  }

  render() {
    const {
      cancelText,
      confirmText,
      icon,
      prompt,
    } = this.props
    return (
      <AlertModal icon={icon}>
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
  prompt: PropTypes.node.isRequired,
  onConfirm: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
}
ConfirmationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
ConfirmationModal.defaultProps = {
  onCancel: null,
  confirmText: 'Roger',
  cancelText: 'Cancel',
}

export default ConfirmationModal
