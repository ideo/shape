import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import {
  Heading3,
} from '~/ui/global/styled/typography'
import {
  FormSpacer,
} from '~/ui/global/styled/forms'
import Modal from '~/ui/global/Modal'
import RolesAdd from '~/ui/roles/RolesAdd'
import RoleSelect from '~/ui/roles/RoleSelect'

function sortUser(a, b) {
  return a.user.name
    ? a.user.name.localeCompare(b.user.name)
    : a.user.email.localeCompare(b.user.email)
}

@inject('apiStore', 'uiStore')
@observer
class RolesMenu extends React.Component {
  onDelete = (role, entity) =>
    this.props.apiStore.request(`users/${entity.id}/roles/${role.id}`,
      'DELETE')

  onCreateRoles = (users, roleName) => {
    const { apiStore, ownerId, ownerType } = this.props
    // TODO eventually have to make this groups?
    const userIds = users.map((user) => user.id)
    const data = { role: { name: roleName }, user_ids: userIds }
    return apiStore.request(`${ownerType}/${ownerId}/roles`, 'POST', data)
      .catch((err) => console.warn(err))
  }

  // TODO what to do about this?
  onCreateUsers = (emails) => {
    const { apiStore } = this.props
    return apiStore.request(`users/create_from_emails`, 'POST', { emails })
  }

  // TODO remoe eventually
  onUserSearch = (searchTerm) => {
    const { apiStore } = this.props
    return apiStore.request(
      `users/search?query=${searchTerm}`
    )
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  render() {
    const { roles, uiStore, title } = this.props
    const roleUsers = []
    roles.forEach((role) =>
      role.users.forEach((user) => {
        roleUsers.push(Object.assign({}, { role, user }))
      }))
    const sortedRoleUsers = roleUsers.sort(sortUser)

    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        open={uiStore.rolesMenuOpen}
      >
        <Heading3>Shared with</Heading3>
        { sortedRoleUsers.map(combined =>
          (<RoleSelect
            key={combined.user.id + combined.role.id}
            role={combined.role}
            user={combined.user}
            onDelete={this.onDelete}
            onCreate={this.onCreateRoles}
          />))
        }
        <FormSpacer />
        <Heading3>Add groups or people</Heading3>
        <RolesAdd
          onCreateRoles={this.onCreateRoles}
          onCreateUsers={this.onCreateUsers}
          onSearch={this.onUserSearch}
        />
      </Modal>
    )
  }
}

RolesMenu.propTypes = {
  ownerId: PropTypes.number.isRequired,
  ownerType: PropTypes.string.isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
  title: PropTypes.string,
}
RolesMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesMenu.defaultProps = {
  roles: [],
  title: 'Sharing',
}

export default RolesMenu
