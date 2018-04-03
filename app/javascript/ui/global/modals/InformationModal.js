import React from 'react'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import CloseIcon from '~/ui/icons/CloseIcon'
import AlertModal from './AlertModal'

@inject('uiStore')
@observer
class InformationModal extends React.Component {
  close() {
    this.props.uiStore.closeInformationModal()
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
      <AlertModal icon={icon}>
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
}
InformationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

InformationModal.defaultProps = {
  prompt: <span>Something went wrong!</span>,
  icon: <CloseIcon />,
}

export default InformationModal
