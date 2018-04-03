import React from 'react'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import CloseIcon from '~/ui/icons/CloseIcon'
import AlertModal from './AlertModal'

// Wrap setTimeout in promise for better API and easier testing
const delay = ms => new Promise((resolve, reject) =>
  setTimeout(() => { resolve(ms) }), ms)

@observer
class InformationModal extends React.Component {
  @observable isOpen = true

  componentDidMount() {
    return delay(this.props.fadeOutTime).then(() => {
      // Change the open value so we get the closing animation from MUI.
      this.setOpen(false)
    })
  }

  @action setOpen(val) {
    this.isOpen = val
  }

  render() {
    const {
      icon,
      prompt,
    } = this.props
    return (
      <AlertModal icon={icon} open={this.isOpen}>
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
  prompt: PropTypes.node,
  icon: PropTypes.node,
  fadeOutTime: PropTypes.number,
}

InformationModal.defaultProps = {
  prompt: <span>Something went wrong!</span>,
  icon: <CloseIcon />,
  fadeOutTime: 2000,
}

export default InformationModal
