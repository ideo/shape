import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import Fade from '@material-ui/core/Fade'

import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import { uiStore } from '~/stores'

const StyledDialog = styled(Dialog)`
  .modal__paper {
    border-left: 17px solid ${v.colors.black};
    max-width: 760px;
    width: 100%;
    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      border-left: 0px;
      height: 100%;
      margin: 0;
      max-height: 100%;
    }
  }
`

const StyledDialogContent = styled.div`
  flex: 1 1 auto;
  &.modal__padding {
    padding: 0 24px 24px 45px;
    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
  &.modal__no-scroll {
    padding-top: 0px;
    padding-bottom: 0px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
`

const StyledDialogTitle = styled(DialogTitle)`
  align-items: center;
  display: flex;
  min-height: 50px;
  position: relative;
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding-top: 14px !important;
    min-height: 30px;
  }
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
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    right: 10px;
    top: 10px;
  }
`
ModalCloseButton.displayName = 'ModalCloseButton'

const BackIconHolder = styled.button`
  cursor: pointer;
  display: block;
  left: 10px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    margin-left: -8px;
    margin-right: 8px;
    position: static;
    transform: none;
  }

  svg {
    height: 18px;
    margin-top: 5px;
  }
`

/*
 * There's a current bug with MaterialUI on iOS where the background of the
 * modal is scrollable along with the modal. This fix will override the back-
 * drop event with a custom handler which feeds into the MaterialUI Dialog
 * component.
 *
 * More information can be found in the Github issue:
 * https://github.com/mui-org/material-ui/issues/5750#issuecomment-390187794
 */
function preventBackdropScroll(event) {
  let { target } = event
  while (target != null && target !== document.body) {
    const { clientHeight, scrollHeight } = target
    if (scrollHeight > clientHeight) return
    target = target.parentElement
  }
  event.preventDefault()
}

export function disableOverflowScroll(node) {
  node.addEventListener('touchmove', preventBackdropScroll)
}

Fade.defaultProps = { ...Fade.defaultProps, onEnter: disableOverflowScroll }
Dialog.defaultProps = {
  ...Dialog.defaultProps,
  onEntered: disableOverflowScroll,
}

class Modal extends React.Component {
  constructor(props) {
    super(props)
    this.contentArea = React.createRef()
  }

  componentDidUpdate() {
    // have to update the ref while we navigate / change the modal
    uiStore.update('modalContentRef', this.contentArea)
  }

  handleClose = ev => {
    ev.preventDefault()
    const { onClose } = this.props
    if (onClose) onClose()
  }

  render() {
    const {
      children,
      onBack,
      onClose,
      open,
      title,
      disableBackdropClick,
      noScroll,
    } = this.props
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
        onBackdropClick={disableBackdropClick ? null : this.handleClose}
        aria-labelledby={title}
        BackdropProps={{ invisible: true }}
      >
        {/*
          NOTE: DialogTitle / DialogContent need to be direct children of Dialog
          for built-in scrolling to work (where title remains fixed at top)
        */}
        <StyledDialogTitle
          classes={{ root: 'modal__padding' }}
          disableTypography
          id="sharing"
        >
          {/* onBack is an optional button */}
          {_.isFunction(onBack) && (
            <BackIconHolder onClick={onBack}>
              <ArrowIcon />
            </BackIconHolder>
          )}
          {wrappedTitle}
        </StyledDialogTitle>
        {/* if onClose is not supplied, then the modal is "locked" until user takes an action */}
        {_.isFunction(onClose) && (
          <ModalCloseButton onClick={this.handleClose}>
            <CloseIcon />
          </ModalCloseButton>
        )}
        <StyledDialogContent
          innerRef={this.contentArea}
          className={['modal__padding', noScroll && 'modal__no-scroll'].join(
            ' '
          )}
        >
          {children}
        </StyledDialogContent>
      </StyledDialog>
    )
  }
}
Modal.propTypes = {
  onClose: PropTypes.func,
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
  open: PropTypes.bool,
  onBack: PropTypes.func,
  disableBackdropClick: PropTypes.bool,
  noScroll: PropTypes.bool,
}

Modal.defaultProps = {
  onClose: null,
  children: <div />,
  open: false,
  onBack: null,
  disableBackdropClick: false,
  noScroll: false,
}

export default Modal
