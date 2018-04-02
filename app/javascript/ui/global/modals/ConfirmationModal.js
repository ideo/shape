import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog, { DialogContent, DialogTitle } from 'material-ui/Dialog'
import { Heading2, ConfirmText } from '~/ui/global/styled/typography'
import { FormActionsContainer, TextButton } from '~/ui/global/styled/forms'
import v from '~/utils/variables'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledDialog = styled(Dialog)`
  .modal__paper {
    background-color: ${v.colors.cloudy};
    border-radius: 6px;
    color: white;
    max-width: 320px;
    opacity: 0.95;
    width: 100%;
  }
`
const ModalCloseButton = styled.button`
  cursor: pointer;
  display: block;
  right: 14px;
  position: absolute;
  top: 12px;
  width: 12px;
`
ModalCloseButton.displayName = 'ModalCloseButton'

const CenteredPaddedContent = styled.div`
  padding: 35px;
  padding-bottom: 25px;
  text-align: center;
`

const ConfirmationPromptWrapper = styled.div`
  margin-bottom: 40px;
  padding: 0;
`

const IconHolder = styled.span`
  width: 84px;
  margin-bottom: 20px;
  display: inline-block;
`

@inject('uiStore')
@observer
class ConfirmationModal extends React.Component {
  close() {
    this.props.uiStore.closeConfirmationModal()
  }

  handleClose = (ev) => {
    ev.preventDefault()
    this.close()
  }

  handleCancel = (ev) => {
    ev.preventDefault()
    const { onCancel } = this.props
    if (!onCancel) return this.close()
    return onCancel()
  }

  handleConfirm = (ev) => {
    ev.preventDefault()
    this.props.onConfirm()
    this.close()
  }

  render() {
    const {
      cancelText,
      confirmText,
      icon,
      prompt,
    } = this.props
    return (
      <StyledDialog
        open
        classes={{ paper: 'modal__paper' }}
        onClose={this.handleClose}
        onBackdropClick={this.handleClose}
        aria-labelledby="Confirmation"
        BackdropProps={{ invisible: true }}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <CenteredPaddedContent>
          <IconHolder>
            { icon }
          </IconHolder>
          <ConfirmationPromptWrapper>
            <ConfirmText>
              { prompt }
            </ConfirmText>
          </ConfirmationPromptWrapper>
          <FormActionsContainer>
            <TextButton onClick={this.handleCancel}>
              {cancelText}
            </TextButton>
            <TextButton onClick={this.handleConfirm}>
              {confirmText}
            </TextButton>
          </FormActionsContainer>
        </CenteredPaddedContent>
      </StyledDialog>
    )
  }
}
ConfirmationModal.propTypes = {
  prompt: PropTypes.node.isRequired,
  onConfirm: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
}
ConfirmationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

ConfirmationModal.defaultProps = {
  onCancel: null,
  confirmText: 'Roger',
  cancelText: 'Cancel',
}

export default ConfirmationModal
