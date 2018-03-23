import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import {
  Heading3,
} from '~/ui/global/styled/typography'
import {
  FormSpacer,
} from '~/ui/global/styled/forms'
import RolesAdd from '~/ui/roles/RolesAdd'
import RoleSelect from '~/ui/roles/RoleSelect'

function sortUser(a, b) {
  return a.user.name
    ? a.user.name.localeCompare(b.user.name)
    : a.user.email.localeCompare(b.user.email)
}

@inject('apiStore')
@observer
class RolesMenu extends React.Component {
  onDelete = (role, entity) =>
    this.props.apiStore.request(`users/${entity.id}/roles/${role.id}`,
      'DELETE')

  onCreateRoles = (users, roleName) => {
    const { apiStore, ownerId, ownerType } = this.props
    const userIds = users.map((user) => user.id)
    const data = { role: { name: roleName }, user_ids: userIds }
    return apiStore.request(`${ownerType}/${ownerId}/roles`, 'POST', data)
      .then(res => {
      // TODO make this generic
        apiStore.find('collections', ownerId).roles = res.data
      })
      .catch((err) => console.warn(err))
  }

  onCreateUsers = (emails) => {
    const { apiStore } = this.props
    return apiStore.request(`users/create_from_emails`, 'POST', { emails })
  }

  onUserSearch = (searchTerm) => {
    const { apiStore } = this.props
    return apiStore.request(
      `users/search?query=${searchTerm}`
    )
  }

  render() {
    const { addCallout, roles, ownerType, title } = this.props
    const roleUsers = []
    roles.forEach((role) =>
      role.users.forEach((user) => {
        roleUsers.push(Object.assign({}, { role, user }))
      }))
    const sortedRoleUsers = roleUsers.sort(sortUser)
    const roleTypes = ownerType === 'groups'
      ? ['member', 'admin']
      : ['viewer', 'editor']

    return (
      <div>
        <Heading3>{title}</Heading3>
        { sortedRoleUsers.map(combined =>
          (<RoleSelect
            key={combined.user.id + combined.role.id}
            role={combined.role}
            roleTypes={roleTypes}
            user={combined.user}
            onDelete={this.onDelete}
            onCreate={this.onCreateRoles}
          />))
        }
        <FormSpacer />
        <Heading3>{addCallout}</Heading3>
        <RolesAdd
          roleTypes={roleTypes}
          onCreateRoles={this.onCreateRoles}
          onCreateUsers={this.onCreateUsers}
          onSearch={this.onUserSearch}
        />
      </div>
    )
  }
}

RolesMenu.propTypes = {
  ownerId: PropTypes.number.isRequired,
  ownerType: PropTypes.string.isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
  title: PropTypes.string,
  addCallout: PropTypes.string,
}
RolesMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesMenu.defaultProps = {
  roles: [],
  title: 'Sharing',
  addCallout: 'Add groups or people:'
}

export default RolesMenu
