import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { withStyles } from 'material-ui/styles'
import Dialog, { DialogContent, DialogTitle } from 'material-ui/Dialog'
import { Heading2 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const materialStyles = {
  paper: {
    borderLeft: `17px solid ${v.colors.blackLava}`,
    boxSizing: 'border-box',
    maxWidth: '855px',
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

const BackIconHolder = styled.button`
  cursor: pointer;
  display: block;
  left: 10px;
  position: absolute;
  top: 33px;
  width: 15px;
`

// TODO figure out what eslint is complaining about here
const PaddedContent = styled.div`
  padding: ${props => { return props.onBack ? '0 20px' : '0' }};
`

class Modal extends React.Component {
  handleClose = (ev) => {
    ev.preventDefault()
    this.props.onClose()
  }

  render() {
    const { children, classes, onBack, open, title } = this.props
    return (
      <Dialog
        classes={classes}
        open={open}
        onClose={this.handleclose}
        aria-labelledby={title}
        BackdropProps={{ invisible: true }}
      >
        { !!onBack && (
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
  onBack: PropTypes.func,
}

Modal.defaultProps = {
  children: <div />,
  open: false,
  onBack: null,
}

export default withStyles(materialStyles)(Modal)
