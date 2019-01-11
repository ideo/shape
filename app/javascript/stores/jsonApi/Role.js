import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class Role extends BaseRecord {
  static type = 'roles'
  static endpoint(collectionId) {
    return apiUrl(`collections/${collectionId}/roles`)
  }

  get label() {
    const { name, resource } = this
    if (name === 'viewer' && resource && resource.isSubmissionBox) {
      return 'participant'
    }
    return name
  }

  API_delete(entity, ownerId, ownerType, opts = {}) {
    const params = {
      role: {
        name: this.name,
      },
      is_switching: opts.isSwitching,
    }
    if (entity.internalType === 'groups') {
      params.group_ids = [entity.id]
    } else {
      params.user_ids = [entity.id]
    }
    return this.apiStore
      .request(`${ownerType}/${ownerId}/roles/${this.id}`, 'DELETE', params)
      .then(res => {
        if (!this.resource.groupRoles || !this.resource.groupRoles.length)
          return res
        const resRoleIds = res.data.map(role => role.id)
        const deletedRole = this.resource.groupRoles.find(
          role => resRoleIds.indexOf(role.id) === -1
        )
        if (deletedRole) this.apiStore.remove('roles', deletedRole.id)
        return res
      })
  }

  // NOTE: RolesMenu also has its own createRoles method -- not sure if this one is used anywhere?
  API_create() {
    // TODO why can't the API figure out where name is if calling toJsonApi?
    return this.apiStore.request(
      `collections/${this.resourceId}/roles`,
      'POST',
      {
        role: {
          name: this.name,
        },
        user_ids: this.users.map(user => user.id),
      }
    )
  }
}

export default Role
