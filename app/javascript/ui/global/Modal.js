import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Dialog, { DialogContent, DialogTitle } from 'material-ui/Dialog'
import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledDialog = styled(Dialog)`
  .modal__paper {
    border-left: 17px solid ${v.colors.blackLava};
    max-width: 855px;
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

const BackIconHolder = styled.button`
  cursor: pointer;
  display: block;
  left: 10px;
  position: absolute;
  top: 33px;
  width: 15px;
`

const PaddedContent = styled.div`
  padding: ${props => (props.onBack ? '0 20px' : '0')};
`

class Modal extends React.Component {
  handleClose = (ev) => {
    ev.preventDefault()
    this.props.onClose()
  }

  render() {
    const { children, onBack, open, title } = this.props
    // TODO progamatically set disableAutoFocus
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        disableAutoFocus
        open={open}
        onClose={this.handleclose}
        aria-labelledby={title}
        BackdropProps={{ invisible: true }}
      >
        { _.isFunction(onBack) && (
          <BackIconHolder onClick={onBack}><ArrowIcon /></BackIconHolder>
        )}
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <PaddedContent onBack={onBack}>
          <DialogTitle disableTypography id="sharing">
            <Heading2>{title}</Heading2>
          </DialogTitle>
          <DialogContent>
            { children }
          </DialogContent>
        </PaddedContent>
      </StyledDialog>
    )
  }
}
Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  open: PropTypes.bool,
  onBack: PropTypes.func,
}

Modal.defaultProps = {
  children: <div />,
  open: false,
  onBack: null,
}

export default Modal
