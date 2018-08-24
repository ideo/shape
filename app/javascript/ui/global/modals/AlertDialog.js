import PropTypes from 'prop-types'

import sleep from '~/utils/sleep'
import Dialog from './Dialog'

class AlertDialog extends React.PureComponent {
  componentWillReceiveProps({ fadeOutTime, open }) {
    if (open !== 'info') return
    if (fadeOutTime) {
      sleep(fadeOutTime).then(() => {
        this.props.onClose()
      })
    }
  }

  get isOpen() {
    return this.props.open === 'info'
  }

  render() {
    const { prompt } = this.props
    const modalProps = { ...this.props, open: this.isOpen }

    return (
      <Dialog {...modalProps}>
        <div>
          <p>
            { prompt }
          </p>
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
  fadeOutTime: 2000,
}

export default AlertDialog
