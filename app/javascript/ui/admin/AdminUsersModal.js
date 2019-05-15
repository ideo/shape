import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'

@inject('uiStore')
@observer
class AdminUsersModal extends React.Component {
  handleClose = async ev => {
    const { uiStore, open } = this.props
    if (open) {
      uiStore.closeAdminUsersMenu()
    }
  }

  render() {
    const { open } = this.props
    const title = 'Invite Shape Admin Users'

    return (
      <Modal title={title} onClose={this.handleClose} open={open} noScroll>
        <div>Add users here</div>
      </Modal>
    )
  }
}

AdminUsersModal.propTypes = {
  open: PropTypes.bool.isRequired,
}
AdminUsersModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminUsersModal
