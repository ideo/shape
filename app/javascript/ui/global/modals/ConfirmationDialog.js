import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import styled from 'styled-components'

import {
  FormActionsContainer,
  SmallTextButton,
  Checkbox,
} from '~/ui/global/styled/forms'
import { ConfirmText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Dialog from './Dialog'

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-top: -10px;
  margin-bottom: 30px;
  .form-control {
    color: white;
  }
`
StyledFormControlLabel.displayName = 'snoozeDialogMessage'

const ConfirmOption = ConfirmText.extend`
  color: black;
  display: block;
  float: left;
  margin-bottom: 70px;
  margin-left: 35px;
  margin-right: 30px;
  width: 190px;

  &:last-child {
    margin-right: 0;
  }
`

class ConfirmationDialog extends React.PureComponent {
  handleCancel = ev => {
    if (ev) ev.preventDefault()
    const { onCancel } = this.props
    if (onCancel) onCancel()
    this.props.onClose()
  }

  handleConfirm = ev => {
    ev.preventDefault()
    this.props.onConfirm(true)
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
      options,
      prompt,
      onToggleSnoozeDialog,
      snoozeChecked,
      image,
    } = this.props

    const modalProps = {
      ...this.props,
      onClose: this.handleCancel,
      open: this.isOpen,
      maxWidth: image ? 'md' : 'sm',
      iconImageOverride: image,
      backgroundColor: image ? v.colors.white : v.colors.commonDark,
    }

    return (
      <Dialog {...modalProps}>
        <form>
          <p data-cy="ConfirmPrompt">{prompt}</p>
          {options.map(option => (
            <ConfirmOption key={option}>{option}</ConfirmOption>
          ))}
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
          <FormActionsContainer style={{ clear: 'both' }}>
            <SmallTextButton
              data-cy="CancelButton"
              maxWidth={options.length ? 200 : 150}
              onClick={this.handleCancel}
            >
              {cancelText}
            </SmallTextButton>
            <SmallTextButton
              data-cy="ConfirmButton"
              maxWidth={options.length ? 200 : 150}
              onClick={this.handleConfirm}
            >
              {confirmText}
            </SmallTextButton>
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
  options: MobxPropTypes.arrayOrObservableArray,
  image: PropTypes.string,
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
  options: [],
  image: null,
  onConfirm: null,
  onCancel: null,
  confirmText: 'OK',
  cancelText: 'Cancel',
  onToggleSnoozeDialog: null,
  snoozeChecked: false,
}

export default ConfirmationDialog
