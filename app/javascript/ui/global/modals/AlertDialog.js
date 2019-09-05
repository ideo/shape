import PropTypes from 'prop-types'

import Dialog from './Dialog'
import { DisplayText } from '../styled/typography'
import v from '~/utils/variables'
class AlertDialog extends React.PureComponent {
  UNSAFE_componentWillReceiveProps({ fadeOutTime, open }) {
    if (open !== 'info') return
    if (fadeOutTime) {
      this.timeout = setTimeout(() => {
        this.props.onClose()
      }, fadeOutTime)
    }
  }

  handleClose = ev => {
    if (this.timeout) clearTimeout(this.timeout)
    this.props.onClose()
  }

  get isOpen() {
    return this.props.open === 'info'
  }

  render() {
    const { prompt } = this.props
    const modalProps = {
      ...this.props,
      onClose: this.handleClose,
      open: this.isOpen,
    }

    return (
      <Dialog {...modalProps}>
        <div>
          <p>{prompt}</p>
          <DisplayText color={v.colors.white} onClick={this.handleClose}>
            OK
          </DisplayText>
        </div>
      </Dialog>
    )
  }
}

AlertDialog.propTypes = {
  ...Dialog.childPropTypes,
  prompt: PropTypes.string,
  open: PropTypes.string,
  iconName: PropTypes.string,
  fadeOutTime: PropTypes.number,
}
AlertDialog.defaultProps = {
  ...Dialog.defaultProps,
  prompt: '',
  open: '',
  iconName: 'Info',
  fadeOutTime: 4000,
}

export default AlertDialog
