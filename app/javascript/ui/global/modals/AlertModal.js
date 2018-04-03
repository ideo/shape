import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dialog from 'material-ui/Dialog'
import { ConfirmText } from '~/ui/global/styled/typography'
import { FormActionsContainer, TextButton } from '~/ui/global/styled/forms'
import v from '~/utils/variables'
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

const IconHolder = styled.span`
  width: 84px;
  margin-bottom: 20px;
  display: inline-block;
`

const PromptText = styled.span`
  & p {
    font-weight: ${v.weights.book};
    font-size: 1.25rem;
    font-family: ${v.fonts.sans};
    margin-bottom: 40px;
    padding: 0;
  }
`

@inject('uiStore')
@observer
class ConfirmationModal extends React.Component {
  close = () => {
    this.props.uiStore.closeAlertModal()
  }

  handleClose = (ev) => {
    ev.preventDefault()
    this.close()
  }

  render() {
    const { children, icon, open } = this.props
    return (
      <StyledDialog
        open={open}
        classes={{ paper: 'modal__paper' }}
        onClose={this.handleClose}
        onExited={this.close}
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
          <PromptText>
            { children }
          </PromptText>
        </CenteredPaddedContent>
      </StyledDialog>
    )
  }
}
ConfirmationModal.propTypes = {
  icon: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  open: PropTypes.bool,
}
ConfirmationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

ConfirmationModal.defaultProps = {
  open: true,
}

export default ConfirmationModal
