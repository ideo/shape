import React from 'react'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import CloseIcon from '~/ui/icons/CloseIcon'
import AlertModal from './AlertModal'

@inject('uiStore')
@observer
class InformationModal extends React.Component {
  @observable isOpen = true

  componentDidMount() {
    window.setTimeout(() => {
      // Change the open value so we get the closing animation from MUI.
      this.setOpen(false)
    }, this.props.fadeOutTime)
  }

  @action setOpen(val) {
    this.isOpen = val
  }

  close() {
    this.props.uiStore.closeAlertModal()
  }

  handleClose = (ev) => {
    ev.preventDefault()
    this.close()
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
InformationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

InformationModal.defaultProps = {
  prompt: <span>Something went wrong!</span>,
  icon: <CloseIcon />,
  fadeOutTime: 2000,
}

export default InformationModal
