import PropTypes from 'prop-types'
import { FormActionsContainer, TextButton } from '~/ui/global/styled/forms'
import AlertModal from './AlertModal'

class ConfirmationModal extends React.PureComponent {
  handleCancel = (ev) => {
    ev.preventDefault()
    const { onCancel } = this.props
    if (onCancel) onCancel()
    this.props.close()
  }

  handleConfirm = (ev) => {
    ev.preventDefault()
    this.props.onConfirm()
    this.props.close()
  }

  get isOpen() {
    return this.props.open === 'confirm'
  }

  render() {
    const {
      cancelText,
      confirmText,
      prompt,
    } = this.props

    const modalProps = { ...this.props, open: this.isOpen }

    return (
      <AlertModal {...modalProps}>
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
  ...AlertModal.propTypes,
  prompt: PropTypes.string,
  open: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
}
ConfirmationModal.defaultProps = {
  ...AlertModal.defaultProps,
  prompt: '',
  open: '',
  onConfirm: null,
  onCancel: null,
  confirmText: 'OK',
  cancelText: 'Cancel',
}

export default ConfirmationModal
