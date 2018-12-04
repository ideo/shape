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

  API_delete(entity, opts = {}) {
    return this.apiStore
      .request(
        `${entity.internalType}/${entity.id}/roles/${this.id}`,
        'DELETE',
        { is_switching: opts.isSwitching }
      )
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
