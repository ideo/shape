import PropTypes from 'prop-types'
import { FormActionsContainer, TextButton } from '~/ui/global/styled/forms'
import Dialog from './Dialog'

class ConfirmationDialog extends React.PureComponent {
  handleCancel = ev => {
    if (ev) ev.preventDefault()
    const { onCancel } = this.props
    if (onCancel) onCancel()
    this.props.onClose()
  }

  handleConfirm = ev => {
    ev.preventDefault()
    this.props.onConfirm()
    this.props.onClose()
  }

  get isOpen() {
    return this.props.open === 'confirm'
  }

  render() {
    const { cancelText, confirmText, prompt } = this.props

    const modalProps = {
      ...this.props,
      onClose: this.handleCancel,
      open: this.isOpen,
      maxWidth: 'sm',
    }

    return (
      <Dialog {...modalProps}>
        <form>
          <p data-cy="ConfirmPrompt">{prompt}</p>
          <FormActionsContainer>
            <TextButton
              data-cy="CancelButton"
              maxWidth={150}
              onClick={this.handleCancel}
            >
              {cancelText}
            </TextButton>
            <TextButton
              data-cy="ConfirmButton"
              maxWidth={150}
              onClick={this.handleConfirm}
            >
              {confirmText}
            </TextButton>
          </FormActionsContainer>
        </form>
      </Dialog>
    )
  }
}

ConfirmationDialog.propTypes = {
  ...Dialog.childPropTypes,
  prompt: PropTypes.string,
  open: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
}
ConfirmationDialog.defaultProps = {
  ...Dialog.defaultProps,
  prompt: '',
  open: '',
  onConfirm: null,
  onCancel: null,
  confirmText: 'OK',
  cancelText: 'Cancel',
}

export default ConfirmationDialog
