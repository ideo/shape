import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'

import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledDialog = styled(Dialog)`
  ${props => props.noStyling && `
    background-color: transparent;
  `}

  .modal__paper {
    border-left: 17px solid ${v.colors.blackLava};
    max-width: 760px;
    width: 100%;

    ${props => props.noStyling && `
      background-color: transparent;
      border-left: none;
      box-shadow: none;
      overflow: hidden;
    `}
  }
`

const StyledDialogTitle = styled(DialogTitle)`
  align-items: center;
  display: flex;
  min-height: 50px;
`

const StyledHeading2 = styled(Heading2)`
  margin-bottom: 0.35rem;
`

export const ModalCloseButton = styled.button`
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

  svg {
    height: 18px;
    margin-top: 5px;
  }
`

const PaddedContent = styled.div`
  padding: 0 20px;
`

class Modal extends React.Component {
  handleClose = (ev) => {
    ev.preventDefault()
    this.props.onClose()
  }

  render() {
    const { children, noStyling, onBack, open, title } = this.props
    let wrappedTitle = title
    if (typeof title === 'string') {
      wrappedTitle = <StyledHeading2>{title}</StyledHeading2>
    }
    // TODO progamatically set disableAutoFocus
    return (
      <StyledDialog
        classes={{ paper: 'modal__paper' }}
        disableAutoFocus
        open={open}
        onClose={this.handleclose}
        onBackdropClick={this.handleClose}
        aria-labelledby={title}
        BackdropProps={{ invisible: true }}
        noStyling={noStyling}
      >
        { _.isFunction(onBack) && (
          <BackIconHolder onClick={onBack}><ArrowIcon /></BackIconHolder>
        )}
        {!noStyling && (<ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>)}
        <PaddedContent onBack={onBack}>
          <StyledDialogTitle disableTypography id="sharing">
            {wrappedTitle}
          </StyledDialogTitle>
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
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
  open: PropTypes.bool,
  onBack: PropTypes.func,
  noStyling: PropTypes.bool,
}

Modal.defaultProps = {
  children: <div />,
  open: false,
  onBack: null,
  noStyling: false,
}

export default Modal
