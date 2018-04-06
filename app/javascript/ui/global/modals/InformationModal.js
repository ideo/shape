import PropTypes from 'prop-types'
// import { action, observable } from 'mobx'
// import { observer } from 'mobx-react'
import AlertModal from './AlertModal'

class InformationModal extends React.PureComponent {
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
}
InformationModal.defaultProps = {
  ...AlertModal.defaultProps,
  prompt: '',
  open: '',
  iconName: 'Alert',
}

export default InformationModal
