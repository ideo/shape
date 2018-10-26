import PropTypes from 'prop-types'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import styled from 'styled-components'

import {
  FormActionsContainer,
  TextButton,
  Checkbox,
} from '~/ui/global/styled/forms'
import Dialog from './Dialog'

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-top: -10px;
  margin-bottom: 30px;
  .form-control {
    color: white;
  }
`
StyledFormControlLabel.displayName = 'snoozeDialogMessage'

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

  handleToggleSnoozeDialog = ev => {
    ev.preventDefault()
    this.props.onToggleSnoozeDialog()
  }

  get isOpen() {
    return this.props.open === 'confirm'
  }

  render() {
    const {
      cancelText,
      confirmText,
      prompt,
      onToggleSnoozeDialog,
      snoozeChecked,
    } = this.props

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
          {onToggleSnoozeDialog && (
            <StyledFormControlLabel
              classes={{ label: 'form-control' }}
              onClick={this.handleToggleSnoozeDialog}
              control={
                <Checkbox
                  checked={snoozeChecked}
                  classes={{
                    root: 'checkbox--white',
                    checked: 'checkbox--checked-white',
                  }}
                  value="yes"
                />
              }
              label="Please don’t show me this warning for a while."
            />
          )}
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
  onToggleSnoozeDialog: PropTypes.func,
  snoozeChecked: PropTypes.bool,
}
ConfirmationDialog.defaultProps = {
  ...Dialog.defaultProps,
  prompt: '',
  open: '',
  onConfirm: null,
  onCancel: null,
  confirmText: 'OK',
  cancelText: 'Cancel',
  onToggleSnoozeDialog: null,
  snoozeChecked: false,
}

export default ConfirmationDialog
