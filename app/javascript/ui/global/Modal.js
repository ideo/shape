import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { withStyles } from 'material-ui/styles'
import Dialog, { DialogContent, DialogTitle } from 'material-ui/Dialog'
import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'

const materialStyles = {
  paper: {
    borderLeft: `17px solid ${v.colors.blackLava}`,
    maxWidth: '855px',
    paddingBottom: '30px',
    width: '100%'
  }
}

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
    const { children, classes, open, title } = this.props
    return (
      <Dialog
        classes={classes}
        open={open}
        onClose={this.handleclose}
        aria-labelledby={title}
        BackdropProps={{ invisible: true }}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <DialogTitle disableTypography id="sharing">
          <Heading2>{title}</Heading2>
        </DialogTitle>
        <DialogContent>
          { children }
        </DialogContent>
      </Dialog>
    )
  }
}
Modal.propTypes = {
  classes: PropTypes.shape({
    paper: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  open: PropTypes.bool,
}

Modal.defaultProps = {
  children: <div />,
  open: false,
}

export default withStyles(materialStyles)(Modal)
