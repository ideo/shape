import _ from 'lodash'
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
import { uiStore } from '~/stores'

// TODO rewrite this
function sortUserOrGroup(a, b) {
  return a.entity.name.localeCompare(b.entity.name)
}

@inject('apiStore', 'routingStore')
@observer
class RolesMenu extends React.Component {
  @observable searchableItems = []

  componentDidMount() {
    const { apiStore, ownerType } = this.props
    const organizationId = apiStore.currentUserOrganizationId
    const req = (type) => this.props.apiStore.request(
      `organizations/${organizationId}/${type}`,
      'GET'
    )
    // Groups should not be addable to other groups, return nothing for
    // consistency
    const reqs = ownerType === 'groups'
      ? [req('users'), Promise.resolve({ data: [] })]
      : [req('users'), req('groups')]

    Promise.all(reqs).then(res => {
      const users = res[0].data
      const groups = res[1].data
      this.visibleUsers = users
      this.visibleGroups = groups
      this.setSearchableItems([...groups, ...users])
      this.filterSearchableItems()
    })
  }

  filterSearchableItems() {
    const filteredUsers = this.filterSearchableUsers(this.visibleUsers)
    const filteredGroups = this.filterSearchableGroups(this.visibleGroups)
    this.setSearchableItems([...filteredGroups, ...filteredUsers])
  }

  filterSearchableUsers(userRoles) {
    const { roles } = this.props
    return _.reject(userRoles, userRole =>
      roles.find(role =>
        role.users.find(user =>
          user.id === userRole.id)))
  }

  filterSearchableGroups(groupRoles) {
    const { roles } = this.props
    return _.reject(groupRoles, groupRole =>
      roles.find(role =>
        role.groups.find(group =>
          group.id === groupRole.id)))
  }

  @action setSearchableItems(items) {
    this.searchableItems = items
  }

  deleteRoles = (role, entity, opts = {}) =>
    role.API_delete(entity, opts)
      .then(res => {
        // We should do a page reload to get the correct user's new org
        if (opts.organizationChange) {
          this.props.routingStore.routeTo('homepage')
          window.location.reload()
        }
        if (!opts.isSwitching) {
          const saveReturn = this.props.onSave(res, { roleName: role.name })
          this.filterSearchableItems()
          return saveReturn
        }
        return {}
      })

  createRoles = (entities, roleName, opts = {}) => {
    const { apiStore, ownerId, ownerType, onSave } = this.props
    const userIds = entities
      .filter(entity => entity.internalType === 'users')
      .map((user) => user.id)
    const groupIds = entities
      .filter(entity => entity.internalType === 'groups')
      .map((group) => group.id)
    const data = {
      role: { name: roleName },
      group_ids: groupIds,
      user_ids: userIds,
      is_switching: opts.isSwitching,
    }
    return apiStore.request(`${ownerType}/${ownerId}/roles`, 'POST', data)
      .then(res => {
        const saveReturn = onSave(res, { roleName })
        this.filterSearchableItems()
        return saveReturn
      })
      .catch((err) => {
        uiStore.alert(err.error[0])
      })
  }

  onCreateUsers = (emails) => {
    const { apiStore } = this.props
    return apiStore.request(`users/create_from_emails`, 'POST', { emails })
      .catch((err) => {
        uiStore.alert(err.error[0])
      })
  }

  onUserSearch = (searchTerm) => {
    const { apiStore } = this.props
    return apiStore.request(
      `users/search?query=${searchTerm}`
    )
  }

  notCurrentUser(entity) {
    // TODO: needs to check group roles too
    if (entity.internalType === 'groups') return true
    const { apiStore } = this.props
    const { currentUser } = apiStore
    return currentUser.id !== entity.id
  }

  render() {
    const {
      addCallout,
      canEdit,
      roles,
      ownerType,
      title,
      fixedRole,
    } = this.props
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
      : ['editor', 'viewer']

    // ability to restrict the selection to only one role type
    // e.g. "admin" is the only selection for Org Admins group
    const addRoleTypes = fixedRole ? [fixedRole] : roleTypes

    return (
      <div>
        <Heading3>{title}</Heading3>
        { sortedRoleEntities.map(combined =>
          // NOTE: content_editor is a "hidden" role for now
          combined.role.name !== 'content_editor' &&
          (<RoleSelect
            enabled={canEdit && this.notCurrentUser(combined.entity, combined.role)}
            key={`${combined.entity.id}_${combined.entity.internalType}_r${combined.role.id}`}
            role={combined.role}
            roleTypes={roleTypes}
            entity={combined.entity}
            onDelete={this.deleteRoles}
            onCreate={this.createRoles}
          />))
        }
        <FormSpacer />
        {canEdit &&
          <div>
            <Heading3>{addCallout}</Heading3>
            <RolesAdd
              searchableItems={this.searchableItems}
              roleTypes={addRoleTypes}
              onCreateRoles={this.createRoles}
              onCreateUsers={this.onCreateUsers}
              ownerType={ownerType}
            />
          </div>
        }
      </div>
    )
  }
}

RolesMenu.propTypes = {
  canEdit: PropTypes.bool,
  ownerId: PropTypes.string.isRequired,
  ownerType: PropTypes.string.isRequired,
  fixedRole: PropTypes.string,
  roles: MobxPropTypes.arrayOrObservableArray,
  title: PropTypes.string,
  addCallout: PropTypes.string,
  onSave: PropTypes.func.isRequired,
}
RolesMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesMenu.defaultProps = {
  canEdit: false,
  fixedRole: null,
  roles: [],
  title: 'Shared with',
  addCallout: 'Add groups or people:'
}

export default RolesMenu
