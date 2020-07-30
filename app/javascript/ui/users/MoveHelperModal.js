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
import { Checkbox, LabelHint, LabelText } from '~/ui/global/styled/forms'
import { SpecialDisplayHeading } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { useTemplateInMyCollection } from '~/utils/url'

const StyledSpecialDisplayHeading = styled(SpecialDisplayHeading)`
  margin: 0;
  margin-bottom: 30px;
`

const StyledLabelText = styled(LabelText)`
  margin: 15px 0px 0px 0px;
  text-transform: none;
  font-weight: normal;
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

const StyledFormControl = styled(FormControl)`
  width: 90%;
`

StyledFormControl.displayName = 'StyledFormControl'

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
    await this.updateUserPreference({
      useTemplateSetting: v.useTemplateSettings.addToMyCollection,
    })
    return useTemplateInMyCollection(this.templateCollection.id)
  }

  @action
  updateUserPreference = ({ useTemplateSetting = null } = {}) => {
    const { apiStore, type } = this.props
    const { currentUser } = apiStore

    if (this.dontShowChecked && type === 'template') {
      return currentUser.API_updateUseTemplateSetting(useTemplateSetting)
    }
  }

  handleClose = () => {
    const { uiStore, apiStore, type } = this.props
    const { currentUser } = apiStore
    if (this.dontShowChecked && type === 'move') {
      currentUser.API_hideMoveHelper(type)
    }
    uiStore.update('dismissedMoveHelper', true)
    uiStore.update('showTemplateHelperForCollection', null)
  }

  letMePlaceIt = async e => {
    const { uiStore } = this.props
    if (this.templateCollection) {
      await this.updateUserPreference({
        useTemplateSetting: v.useTemplateSettings.letMePlaceIt,
      })
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
    return (
      <div>
        <div style={{ display: 'flex', margin: '0px 18px 20px 18px' }}>
          <Button
            onClick={this.letMePlaceIt}
            minWidth={193}
            size="sm"
            colorScheme={v.colors.black}
            outline
            data-cy="MoveHelperModal-letMePlaceItBtn"
          >
            Let me place it
          </Button>
          <span style={{ flex: 1 }} />
          <Button
            onClick={this.handleAddToMyCollection}
            minWidth={250}
            size="sm"
            data-cy="MoveHelperModal-addToMyCollectionBtn"
          >
            Add to my collection
          </Button>
        </div>
      </div>
    )
  }

  render() {
    const { apiStore, type } = this.props
    const { currentUser } = apiStore
    const modalLabel =
      type === 'template' ? (
        <div>
          <StyledLabelText>
            {v.helperModalLabels.templateHelperLabel}
          </StyledLabelText>
          <LabelHint>{v.helperModalLabels.templateHelperHint}</LabelHint>
        </div>
      ) : (
        v.helperModalLabels.moveHelper
      )
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
            type === 'template' &&
            this.renderModalButtons}
          <StyledFormControl component="fieldset" required>
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
              label={modalLabel}
            />
          </StyledFormControl>

          {!(currentUser.show_template_helper && type === 'template') && (
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
