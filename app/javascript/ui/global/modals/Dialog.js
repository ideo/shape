import PropTypes from 'prop-types'
import styled from 'styled-components'
import MuiDialog from '@material-ui/core/Dialog'

import v from '~/utils/variables'
import ICONS from '~/ui/icons/dialogIcons'

const { CloseIcon } = ICONS

const StyledDialog = styled(MuiDialog)`
  .modal__paper {
    background-color: ${props => props.backgroundColor};
    border-radius: 6px;
    color: white;
    opacity: 0.95;
    width: 100%;
    &-sm {
      max-width: 425px;
    }
    &-md {
      max-width: 560px;
    }
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
  padding: 30px 20px;
  text-align: center;
`

const IconHolder = styled.span`
  width: 84px;
  margin-bottom: 30px;
`

const ImageHolder = styled.span`
  display: inline-block;
  margin-top: 25px;
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

class Dialog extends React.PureComponent {
  handleClose = ev => {
    ev.preventDefault()
    this.props.onClose()
  }

  get icon() {
    const { iconName, iconImageOverride } = this.props
    if (iconImageOverride) {
      return (
        <ImageHolder>
          <img
            style={{ width: '450px', marginLeft: '-25px' }}
            src={iconImageOverride}
            alt=""
          />
        </ImageHolder>
      )
    }
    const icon = ICONS[`${iconName}Icon`]
    const iconEl = icon ? React.createElement(icon) : ''
    return <IconHolder>{iconEl}</IconHolder>
  }

  render() {
    const { children, backgroundColor, open, maxWidth } = this.props
    return (
      <StyledDialog
        open={open}
        classes={{
          paper: 'modal__paper',
          paperWidthSm: 'modal__paper-sm',
          paperWidthMd: 'modal__paper-md',
        }}
        onClose={this.handleClose}
        onBackdropClick={this.handleClose}
        aria-labelledby="Confirmation"
        BackdropProps={{ invisible: true }}
        maxWidth={maxWidth}
        backgroundColor={backgroundColor}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <CenteredPaddedContent>
          {this.icon}
          <PromptText>{children}</PromptText>
        </CenteredPaddedContent>
      </StyledDialog>
    )
  }
}

Dialog.propTypes = {
  iconName: PropTypes.oneOf([
    'Alert',
    'Archive',
    'Back',
    'Close',
    'Leave',
    'Link',
    'Ok',
    'TestGraph',
    'Mail',
    'Template',
  ]),
  iconImageOverride: PropTypes.string,
  children: PropTypes.node.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  maxWidth: PropTypes.string,
  backgroundColor: PropTypes.oneOf(Object.values(v.colors)),
}
Dialog.defaultProps = {
  iconName: 'Alert',
  maxWidth: 'xs', // 'xs' == 360px
  iconImageOverride: null,
  backgroundColor: v.colors.commonDark,
}
// all propTypes except required `children` node, to be used by Information/ConfirmationModal
const { children, ...childPropTypes } = Dialog.propTypes
Dialog.childPropTypes = childPropTypes

export default Dialog
