import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'

@inject('apiStore', 'uiStore')
@observer
class Roles extends React.Component {
  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  onSave = (res) => {
    const { apiStore, record } = this.props
    // TODO why is the API sometimes returning an {} vs [] here?
    let formattedRes = res.data
    if (!_.isArray(res.data)) formattedRes = [res.data]
    apiStore.find(record.internalType, record.id).roles = formattedRes
  }

  render() {
    const { roles, uiStore, record } = this.props

    return (
      <Modal
        title="Sharing"
        onClose={this.handleClose}
        open={uiStore.rolesMenuOpen}
      >
        <RolesMenu
          canEdit={record.can_edit}
          ownerId={record.id}
          ownerType={record.internalType}
          title="Shared with"
          roles={roles}
          onSave={this.onSave}
        />
      </Modal>
    )
  }
}

Roles.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
}
Roles.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
Roles.defaultProps = {
  roles: [],
}

export default Roles
