import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog, { DialogContent, DialogTitle } from 'material-ui/Dialog'
import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledDialog = styled(Dialog)`
  .modal__paper {
  }
`
const ModalCloseButton = styled.button`
  cursor: pointer;
  display: block;
  right: 28px;
  position: absolute;
  top: 24px;
  width: 14px;
`
ModalCloseButton.displayName = 'ModalCloseButton'

const PaddedContent = styled.div`
  padding: 0 20px;
`

@inject('uiStore')
@observer
class ConfirmationModal extends React.Component {
  handleClose = (ev) => {
    ev.preventDefault()
    uiStore.closeConfirmationModal()
  }

  render() {
    const { cancelText, confirmText, prompt } = this.props
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        onClose={this.handleclose}
        onBackdropClick={this.handleClose}
        aria-labelledby="Confirmation"
        BackdropProps={{ invisible: true }}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <PaddedContent>
          <DialogContent>
            { prompt }
          </DialogContent>
        </PaddedContent>
      </StyledDialog>
    )
  }
}
ConfirmationModal.propTypes = {
  prompt: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  icon: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
}
ConfirmationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

ConfirmationModal.defaultProps = {
  onCancel: () => { this.onCancel() },
  confirmText: 'Roger',
  cancelText: 'Cancel',
}

export default ConfirmationModal
