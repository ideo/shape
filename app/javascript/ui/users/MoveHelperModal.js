import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import { FormButton, Checkbox } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

const SpecialDisplayHeading = styled.p`
  text-align: center;
  margin: 0;
  margin-bottom: 30px;
  line-height: 1.625rem;
  font-family: ${v.fonts.sans};
  font-size: 1.25rem;
  font-weight: ${v.weights.book};
  color: ${v.colors.black};
`

const StyledDialog = styled(Dialog)`
  .modal__paper {
    text-align: center;
    padding: 20px;
    padding-top: 35px;
    max-width: 445px;
    min-width: 540px;
    width: 100%;
  }
`
StyledDialog.displayName = 'StyledDialog'

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
        <DialogContent>
          <form onSubmit={this.handleSubmit}>
            <img
              src="https://s3-us-west-2.amazonaws.com/assets.shape.space/move_helper_diagram.png"
              alt="Diagram showing moving items between multiple collections"
              style={{ width: '410px', marginBottom: '40px' }}
            />
            <SpecialDisplayHeading>{this.helperText}</SpecialDisplayHeading>
            <FormControl component="fieldset" required>
              <FormControlLabel
                classes={{ label: 'form-control' }}
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
              <FormButton disabled={this.isLoading}>Close</FormButton>
            </div>
          </form>
        </DialogContent>
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
