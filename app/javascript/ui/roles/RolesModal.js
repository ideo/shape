import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/modals/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'
import RolesAdd from '~/ui/roles/RolesAdd'

@inject('uiStore', 'apiStore')
@observer
class RolesModal extends React.Component {
  handleClose = async ev => {
    const { uiStore, record, open } = this.props
    if (open) {
      if (uiStore.viewingRecord === record) {
        // re-fetch record in case roles were altered during RolesMenu searching/editing
        await record.refetch()
      }
      uiStore.closeRolesMenu()
    }
  }

  createRoles = (entities, roleName, opts = {}) => {
    const { apiStore, uiStore, record } = this.props
    let { id, internalType } = record
    const userIds = entities
      .filter(entity => entity.internalType === 'users')
      .map(user => user.id)
    const groupIds = entities
      .filter(entity => entity.internalType === 'groups')
      .map(group => group.id)
    const data = {
      role: { name: roleName },
      group_ids: groupIds,
      user_ids: userIds,
      is_switching: opts.isSwitching,
      send_invites: opts.sendInvites,
    }
    if (opts.addToGroupId) {
      id = opts.addToGroupId
      internalType = 'groups'
    }
    return apiStore
      .request(`${internalType}/${id}/roles`, 'POST', data)
      .catch(err => {
        uiStore.alert(err.error[0])
      })
  }

  onCreateUsers = async emails => {
    const { apiStore, uiStore } = this.props
    return apiStore
      .request(`users/create_from_emails`, 'POST', { emails })
      .catch(err => {
        uiStore.alert(err.error[0])
      })
  }

  get dialogActions() {
    const { record } = this.props

    const roleTypes = type => {
      if (type === 'groups') return ['member', 'admin']
      return ['editor', 'viewer']
    }

    const ownerType = record.internalType

    // FIXME: fixedRole and groups are not implemented
    // ability to restrict the selection to only one role type
    // e.g. "admin" is the only selection for Org Admins group
    // const addRoleTypes = fixedRole ? [fixedRole] : roleTypes(ownerType)
    const addRoleTypes = roleTypes(ownerType)

    // const editableGroups = groups.filter(group => group.can_edit)
    const editableGroups = []

    return (
      <RolesAdd
        roleTypes={addRoleTypes}
        roleLabels={record.isSubmissionBox ? { viewer: 'participant' } : {}}
        onCreateRoles={this.createRoles}
        onCreateUsers={this.onCreateUsers}
        ownerType={ownerType}
        addableGroups={editableGroups}
        defaultGroupId={record.default_group_id}
      />
    )
  }

  render() {
    const { record, open } = this.props
    const title = `Sharing: ${record.name}`

    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        open={open}
        noScroll
        dialogActions={this.dialogActions}
      >
        <RolesMenu
          record={record}
          canEdit={record.can_edit}
          ownerId={record.id}
          ownerType={record.internalType}
          submissionBox={record.isSubmissionBox}
          createRoles={this.createRoles}
          title="Shared with"
        />
      </Modal>
    )
  }
}

RolesModal.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  open: PropTypes.bool.isRequired,
}
RolesModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RolesModal
