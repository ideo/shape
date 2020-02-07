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
import Button from '~/ui/global/Button'
import TextButton from '~/ui/global/TextButton'
import { Checkbox } from '~/ui/global/styled/forms'
import {
  SpecialDisplayHeading,
  DisplayText,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CardMoveService from '~/utils/CardMoveService'

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

@inject('uiStore', 'apiStore', 'routingStore')
@observer
class MoveHelperModal extends React.Component {
  @observable
  dontShowChecked = false
  @observable
  isLoading = false

  get templateCollection() {
    const { uiStore } = this.props
    return uiStore.showTemplateHelperForCollection
  }

  @action
  handleDontShowCheck = event => {
    this.dontShowChecked = event.target.checked
  }

  handleAddToMyCollection = async e => {
    this.updateUserPreference()

    const { uiStore, apiStore, routingStore } = this.props
    const { currentUser } = apiStore
    const user_collection_id = currentUser.current_user_collection_id
    uiStore.update('cardAction', 'useTemplate')
    if (!apiStore.find('collections', user_collection_id)) {
      await apiStore.fetch('collections', user_collection_id)
    }
    await CardMoveService.moveCards('end', {
      to_id: user_collection_id,
      from_id: this.templateCollection.id,
    })
    uiStore.closeMoveMenu()
    routingStore.routeTo('homepage')
  }

  @action
  updateUserPreference = () => {
    const { apiStore, type } = this.props
    const { currentUser } = apiStore
    if (this.dontShowChecked) {
      currentUser.API_hideHelper(type)
    }
  }

  handleClose = () => {
    const { uiStore } = this.props
    this.updateUserPreference()
    uiStore.update('dismissedMoveHelper', true)
    uiStore.update('showTemplateHelperForCollection', null)
  }

  letMePlaceIt = e => {
    const { uiStore } = this.props
    if (this.templateCollection) {
      uiStore.openMoveMenu({
        from: this.templateCollection,
        cardAction: 'useTemplate',
      })
      this.handleClose()
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
    const { uiStore } = this.props

    return (
      <div>
        <div style={{ marginBottom: '18px' }}>
          <DisplayText>{uiStore.templateName}</DisplayText>
        </div>
        <Button
          onClick={this.handleAddToMyCollection}
          minWidth={250}
          size="sm"
          data-cy="MoveHelperModal-addToMyCollectionBtn"
        >
          Add to my collection
        </Button>
        <div style={{ marginBottom: '12px', marginTop: '12px' }}>
          <DisplayText>or</DisplayText>
        </div>
        <Button
          onClick={this.letMePlaceIt}
          size="sm"
          colorScheme="transparent"
          data-cy="MoveHelperModal-letMePlaceItBtn"
        >
          Let me place it
        </Button>
      </div>
    )
  }

  render() {
    const { apiStore, type } = this.props
    const { currentUser } = apiStore
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        open
        BackdropProps={{
          invisible: true,
        }}
        data-cy={`${type}HelperModal`}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <StyledDialogContent>
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
                onClick={this.handleClose}
                data-cy="MoveHelperModal-closeBtn"
                disabled={this.isLoading}
              >
                Close
              </TextButton>
            </div>
          )}
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
  type: 'move',
}

export default MoveHelperModal
