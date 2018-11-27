import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'

@inject('apiStore', 'uiStore')
@observer
class RolesModal extends React.Component {
  componentDidMount() {
    this.fetchRoles()
  }

  componentDidUpdate() {
    this.fetchRoles()
  }

  fetchRoles() {
    const { apiStore, roles, record } = this.props
    if (!roles.length && this.isOpen) {
      // NOTE: this will re-fetch the entire collection/item in order to get the attached roles
      apiStore.fetch(record.internalType, record.id)
    }
  }

  get isOpen() {
    const { uiStore } = this.props
    return !!uiStore.rolesMenuOpen
  }

  handleClose = ev => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  onSave = res => {
    const { apiStore, record } = this.props
    // TODO why is the API sometimes returning an {} vs [] here?
    let formattedRes = res.data
    if (!_.isArray(res.data)) formattedRes = [res.data]
    apiStore.find(record.internalType, record.id).roles = formattedRes
  }

  render() {
    const { roles, record } = this.props
    const title = `Sharing: ${record.name}`

    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        open={this.isOpen}
        noScroll
      >
        <RolesMenu
          canEdit={record.can_edit}
          ownerId={record.id}
          ownerType={record.internalType}
          submissionBox={record.isSubmissionBox}
          title="Shared with"
          roles={roles}
          onSave={this.onSave}
        />
      </Modal>
    )
  }
}

RolesModal.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
}
RolesModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesModal.defaultProps = {
  roles: [],
}

export default RolesModal
