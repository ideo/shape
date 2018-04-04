import React from 'react'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import CloseIcon from '~/ui/icons/CloseIcon'
import AlertModal from './AlertModal'

// Wrap setTimeout in promise for better API and easier testing
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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
      iconName,
      prompt,
    } = this.props
    return (
      <AlertModal open={this.isOpen} iconName={iconName}>
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
  iconName: AlertModal.propTypes.iconName,
  prompt: PropTypes.node,
  fadeOutTime: PropTypes.number,
}

InformationModal.defaultProps = {
  iconName: 'CloseIcon',
  prompt: <span>Something went wrong!</span>,
  fadeOutTime: 2000,
}

export default InformationModal
