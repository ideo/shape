import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Dialog, { DialogContent, DialogTitle } from 'material-ui/Dialog'
import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledDialog = styled(Dialog)`
  .modal__paper {
    border-left: 17px solid ${v.colors.blackLava};
    max-width: 855px;
    padding-bottom: 30px;
    width: 100%;
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

class Modal extends React.Component {
  handleClose = (ev) => {
    ev.preventDefault()
    this.props.onClose()
  }

  render() {
    const { children, open, title } = this.props
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        open={open}
        onClose={this.handleclose}
        aria-labelledby={title}
        BackdropProps={{ invisible: true }}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <DialogTitle disableTypography id="sharing">
<<<<<<< HEAD
          <Heading2>{title}</Heading2>
=======
          <Heading2>Sharing</Heading2>
>>>>>>> Shared modals
        </DialogTitle>
        <DialogContent>
          { children }
        </DialogContent>
      </StyledDialog>
    )
  }
}
Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  open: PropTypes.bool,
}

Modal.defaultProps = {
  children: <div />,
  open: false,
}

export default Modal
