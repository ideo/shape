import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import ICONS from '~/ui/icons/dialogIcons'
const { CloseIcon } = ICONS
import { TextButton } from '~/ui/global/styled/buttons'
import { Checkbox } from '~/ui/global/styled/forms'
import { SpecialDisplayHeading } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const StyledSpecialDisplayHeading = styled(SpecialDisplayHeading)`
  margin: 0;
  margin-bottom: 30px;
`

const StyledDialog = styled(Dialog)`
  .modal__paper {
    text-align: center;
    padding: 20px;
    padding-top: 35px;
    max-width: 540px;
    width: 100%;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      margin: 0;
      max-width: 100%;
      min-height: 100vh;
    }
  }
`
StyledDialog.displayName = 'StyledDialog'

const ModalCloseButton = styled.button`
  cursor: pointer;
  display: block;
  right: 14px;
  position: absolute;
  top: 12px;
  width: 12px;
`
ModalCloseButton.displayName = 'ModalCloseButton'

const StyledDialogContent = styled(DialogContent)`
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    /* clear the Move Modal pill regardless of screen size */
    padding-bottom: 120px !important;
  }
`

@inject('uiStore')
@observer
class MoveHelperModal extends React.Component {
  @observable
  dontShowChecked = false
  @observable
  isLoading = false
  @observable
  submitted = false

  @action
  handleDontShowCheck = event => {
    this.dontShowChecked = event.target.checked
  }

  @action
  handleSubmit = e => {
    e.preventDefault()
    const { currentUser, type, uiStore } = this.props
    this.submitted = true
    uiStore.update('dismissedMoveHelper', true)
    if (this.dontShowChecked) {
      currentUser.API_hideHelper(type)
    }
  }

  get helperText() {
    const { type, recordName } = this.props
    let text = ''
    if (type === 'move') {
      text = `
        Did you know when moving, duplicating, or linking items,
        you can navigate to another collection to place the items there?
      `
    } else if (type === 'template') {
      text = `
        Did you know? You can navigate to wherever you would like to place
        "${recordName}", and use the up or down arrows to place it at the top or
        bottom of the collection.
      `
    }
    return text
  }

  render() {
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        open={!this.submitted}
        BackdropProps={{
          invisible: true,
        }}
      >
        <ModalCloseButton onClick={this.handleSubmit}>
          <CloseIcon />
        </ModalCloseButton>
        <StyledDialogContent>
          <form onSubmit={this.handleSubmit}>
            <img
              src="https://s3-us-west-2.amazonaws.com/assets.shape.space/move_helper_diagram.png"
              alt="Diagram showing moving items between multiple collections"
              style={{ width: '100%', maxWidth: '410px', marginBottom: '40px' }}
            />
            <StyledSpecialDisplayHeading>
              {this.helperText}
            </StyledSpecialDisplayHeading>
            <FormControl component="fieldset" required>
              <FormControlLabel
                classes={{ label: 'form-control' }}
                style={{ textAlign: 'left' }}
                control={
                  <Checkbox
                    checked={this.dontShowChecked}
                    onChange={this.handleDontShowCheck}
                    value="yes"
                  />
                }
                label="Thanks, please don't show me this message again."
              />
              <div style={{ height: '54px' }} />
            </FormControl>

            <div className="button--center">
              <TextButton
                data-cy="MoveHelperModal-button"
                disabled={this.isLoading}
              >
                Close
              </TextButton>
            </div>
          </form>
        </StyledDialogContent>
      </StyledDialog>
    )
  }
}

MoveHelperModal.propTypes = {
  currentUser: MobxPropTypes.objectOrObservableObject.isRequired,
  recordName: PropTypes.string,
  type: PropTypes.string,
}

MoveHelperModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

MoveHelperModal.defaultProps = {
  type: 'move', // types are 'move' or 'template'
  recordName: null,
}

export default MoveHelperModal
