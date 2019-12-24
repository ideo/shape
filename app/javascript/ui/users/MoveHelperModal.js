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
import { TextButton, FormButton } from '~/ui/global/styled/buttons'
import { Checkbox } from '~/ui/global/styled/forms'
import {
  SpecialDisplayHeading,
  DisplayText,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CardMoveService from '~/ui/grid/CardMoveService'

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

const LetMeButton = styled(FormButton)`
  border: 1px solid ${v.colors.commonDark};
  color: ${v.colors.commonDark};
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.medium};
  font-size: 12px;
  margin-top: 8px;
`
LetMeButton.displayName = 'LetMeButton'

@inject('uiStore', 'apiStore', 'routingStore')
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
  handleAddToMyCollection = async e => {
    const { uiStore, apiStore, routingStore } = this.props
    const { currentUser } = apiStore
    uiStore.cardAction = 'useTemplate'
    await CardMoveService.moveCards('end', {
      to_id: currentUser.current_user_collection_id,
    })
    routingStore.routeTo('homepage')
  }

  @action
  handleSubmit = e => {
    e.preventDefault()
    const { apiStore, type, uiStore } = this.props
    const { currentUser } = apiStore
    this.submitted = true
    uiStore.update('dismissedMoveHelper', true)
    if (this.dontShowChecked) {
      currentUser.API_hideHelper(type)
    }
    if (uiStore.showTemplateHelperForCollection) {
      uiStore.openMoveMenu({
        from: uiStore.showTemplateHelperForCollection,
        cardAction: 'useTemplate',
      })
      uiStore.update('showTemplateHelperForCollection', null)
    }
  }

  get helperText() {
    const { type } = this.props
    let text = ''
    if (type === 'move') {
      text = `
        Did you know when moving, duplicating, or linking items,
        you can navigate to another collection to place the items there?
      `
    } else if (type === 'template') {
      text = 'Where would you like to place your template?'
    }
    return text
  }

  get renderModalButtons() {
    return (
      <div>
        <div style={{ marginBottom: '18px' }}>
          <DisplayText>Recommended when getting started</DisplayText>
        </div>
        <FormButton
          onClick={this.handleAddToMyCollection}
          minWidth={250}
          fontFamily={v.fonts.sans}
          fontWeight={v.weights.medium}
          fontSize={0.75}
          minWidth={250}
          color={v.colors.black}
        >
          Add to my collection
        </FormButton>
        <div style={{ marginBottom: '12px', marginTop: '12px' }}>
          <DisplayText>or</DisplayText>
        </div>
        <FormButton
          fontFamily={v.fonts.sans}
          fontWeight={v.weights.medium}
          fontSize={0.75}
          color={v.colors.commonDark}
          transparent
        >
          Let me place it
        </FormButton>
      </div>
    )
  }

  render() {
    const { apiStore, type } = this.props
    const { currentUser } = apiStore
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
            {currentUser.show_template_helper &&
              type == 'template' &&
              this.renderModalButtons}
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
            </FormControl>

            {!(currentUser.show_template_helper && type == 'template') && (
              <div className="button--center">
                <TextButton
                  data-cy="MoveHelperModal-button"
                  disabled={this.isLoading}
                >
                  Close
                </TextButton>
              </div>
            )}
          </form>
        </StyledDialogContent>
      </StyledDialog>
    )
  }
}

MoveHelperModal.propTypes = {
  type: PropTypes.oneOf(['move', 'template']),
}

MoveHelperModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

MoveHelperModal.defaultProps = {
  type: 'move', // types are 'move' or 'template'
}

export default MoveHelperModal
