import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import {
  Heading3,
} from '~/ui/global/styled/typography'
import {
  FormSpacer,
} from '~/ui/global/styled/forms'
import RolesAdd from '~/ui/roles/RolesAdd'
import RoleSelect from '~/ui/roles/RoleSelect'

// TODO rewrite this
function sortUserOrGroup(a, b) {
  return a.entity.name.localeCompare(b.entity.name)
}

@inject('apiStore')
@observer
class RolesMenu extends React.Component {
  @observable searchableItems = []

  componentDidMount() {
    const { apiStore } = this.props
    const organizationId = apiStore.currentUser.current_organization.id
    const req = (type) => this.props.apiStore.request(
      `organizations/${organizationId}/${type}`,
      'GET'
    )
    Promise.all([req('groups'), req('users')]).then(res => {
      const groups = res[0].data
      const users = res[1].data
      groups.forEach(r => { r.type = 'groups' })
      users.forEach((u) => { u.type = 'users' })
      return this.setSearchableItems([...groups, ...users])
    })
  }

  @action setSearchableItems(items) {
    this.searchableItems = items
  }

  onDelete = (role, entity) =>
    this.props.apiStore.request(
      `${entity.type}/${entity.id}/roles/${role.id}`,
      'DELETE'
    )

  onCreateRoles = (entities, roleName) => {
    const { apiStore, ownerId, ownerType, onSave } = this.props
    const userIds = entities
      .filter(entity => entity.type === 'users')
      .map((user) => user.id)
    const groupIds = entities
      .filter(entity => entity.type === 'groups')
      .map((group) => group.id)
    const data = {
      role: { name: roleName },
      group_ids: groupIds,
      user_ids: userIds,
    }
    return apiStore.request(`${ownerType}/${ownerId}/roles`, 'POST', data)
      .then(onSave)
      .catch((err) => console.warn(err))
  }

  onCreateUsers = (emails) => {
    const { apiStore } = this.props
    return apiStore.request(`users/create_from_emails`, 'POST', { emails })
  }

  render() {
    const { addCallout, roles, ownerType, title } = this.props
    const roleEntities = []
    roles.forEach((role) => {
      role.users.forEach((user) => {
        roleEntities.push(Object.assign({}, { role, entity: user }))
      })
      // TODO remove when implemented
      if (!role.groups) return
      role.groups.forEach((group) => {
        roleEntities.push(Object.assign({}, { role, entity: group }))
      })
    })
    const sortedRoleEntities = roleEntities.sort(sortUserOrGroup)
    const roleTypes = ownerType === 'groups'
      ? ['member', 'admin']
      : ['viewer', 'editor']

    return (
      <div>
        <Heading3>{title}</Heading3>
        { sortedRoleEntities.map(combined =>
          (<RoleSelect
            key={combined.entity.id + combined.role.id}
            role={combined.role}
            roleTypes={roleTypes}
            entity={combined.entity}
            onDelete={this.onDelete}
            onCreate={this.onCreateRoles}
          />))
        }
        <FormSpacer />
        <Heading3>{addCallout}</Heading3>
        <RolesAdd
          searchableItems={this.searchableItems}
          roleTypes={roleTypes}
          onCreateRoles={this.onCreateRoles}
          onCreateUsers={this.onCreateUsers}
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
  onSave: PropTypes.func.isRequired,
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
