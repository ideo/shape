import PropTypes from 'prop-types'
import AlertModal from './AlertModal'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class InformationModal extends React.PureComponent {
  componentWillReceiveProps({ fadeOutTime, open }) {
    if (open !== 'info') return
    if (fadeOutTime) {
      delay(fadeOutTime).then(() => {
        this.props.close()
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
      <AlertModal {...modalProps}>
        <div>
          <p>
            { prompt }
          </p>
        </div>
      </AlertModal>
    )
  }
}

InformationModal.propTypes = {
  ...AlertModal.propTypes,
  prompt: PropTypes.string,
  open: PropTypes.string,
  iconName: PropTypes.string,
  fadeOutTime: PropTypes.number,
}
InformationModal.defaultProps = {
  ...AlertModal.defaultProps,
  prompt: '',
  open: '',
  iconName: 'Alert',
  fadeOutTime: 2000,
}

export default InformationModal
