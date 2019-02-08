import PropTypes from 'prop-types'
import { FormControlLabel, Grid } from '@material-ui/core'
import styled from 'styled-components'

import {
  FormActionsContainer,
  TextButton,
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

const OrLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${v.colors.primaryDark};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  text-align: center;
  > span {
    margin-bottom: 3em;
  }
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    border-bottom: thin solid ${v.colors.primaryDark};
    display: block;
    height: auto;
    margin: 30px 0;
    > span {
      background-color: ${v.colors.white};
      display: inline-block;
      margin-bottom: 0;
      padding: 5px 10px;
      position: absolute;
      transform: translate(-50%, -50%);
    }
  }
`

const OptionImage = styled.img`
  display: block;
  margin: 0 auto 20px;
  max-width: 90%;
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    max-width: 40%;
    margin-bottom: 10px;
  }
`

const ConfirmOption = ConfirmText.extend`
  color: black;
  display: block;
  margin: 0 auto 70px;
  max-width: 190px;
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    margin-bottom: 20px;
  }
`

const OptionsButton = TextButton.extend`
  color: ${v.colors.black};
  font-size: 0.75rem;
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
      cancelImage,
      cancelPrompt,
      cancelText,
      confirmImage,
      confirmPrompt,
      confirmText,
      prompt,
      onToggleSnoozeDialog,
      snoozeChecked,
      image,
    } = this.props

    // TODO: as far as I can tell, no remaining instance of this dialogue uses the a `props.image`

    const twoColumn = !!(confirmPrompt || cancelPrompt)
    const bigModal = !!(image || twoColumn)

    const modalProps = {
      ...this.props,
      onClose: this.handleCancel,
      open: this.isOpen,
      maxWidth: bigModal ? 'md' : 'sm',
      iconImageOverride: image,
      backgroundColor: bigModal ? v.colors.white : v.colors.commonDark,
    }

    const ButtonEl = bigModal ? OptionsButton : TextButton

    return (
      <Dialog {...modalProps}>
        <form>
          {prompt && <p data-cy="ConfirmPrompt">{prompt}</p>}
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
          <Grid container justify="center">
            <Grid item xs={twoColumn ? 12 : true} sm>
              {cancelImage && <OptionImage src={cancelImage} alt="" />}
              {cancelPrompt && <ConfirmOption>{cancelPrompt}</ConfirmOption>}
              <FormActionsContainer>
                <ButtonEl
                  data-cy="CancelButton"
                  maxWidth="200"
                  onClick={this.handleCancel}
                >
                  {cancelText}
                </ButtonEl>
              </FormActionsContainer>
            </Grid>
            {twoColumn && (
              <Grid item xs={12} sm={1} style={{ color: v.colors.primaryDark }}>
                <OrLabel>
                  <span>or</span>
                </OrLabel>
              </Grid>
            )}
            <Grid item xs={twoColumn ? 12 : true} sm>
              {confirmImage && <OptionImage src={confirmImage} alt="" />}
              {confirmPrompt && <ConfirmOption>{confirmPrompt}</ConfirmOption>}
              <FormActionsContainer>
                <ButtonEl
                  data-cy="ConfirmButton"
                  maxWidth="200"
                  onClick={this.handleConfirm}
                >
                  {confirmText}
                </ButtonEl>
              </FormActionsContainer>
            </Grid>
          </Grid>
        </form>
      </Dialog>
    )
  }
}

ConfirmationDialog.propTypes = {
  ...Dialog.childPropTypes,
  prompt: PropTypes.string,
  open: PropTypes.string,
  image: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  confirmImage: PropTypes.string,
  confirmPrompt: PropTypes.string,
  confirmText: PropTypes.string,
  cancelImage: PropTypes.string,
  cancelPrompt: PropTypes.string,
  cancelText: PropTypes.string,
  onToggleSnoozeDialog: PropTypes.func,
  snoozeChecked: PropTypes.bool,
}
ConfirmationDialog.defaultProps = {
  ...Dialog.defaultProps,
  prompt: '',
  open: '',
  image: null,
  onConfirm: null,
  onCancel: null,
  confirmImage: null,
  confirmPrompt: null,
  confirmText: 'OK',
  cancelImage: null,
  cancelPrompt: null,
  cancelText: 'Cancel',
  onToggleSnoozeDialog: null,
  snoozeChecked: false,
}

export default ConfirmationDialog
