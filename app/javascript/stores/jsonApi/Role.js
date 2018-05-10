import BaseRecord from './BaseRecord'

class Role extends BaseRecord {
  static endpoint(collectionId) {
    return `collections/${collectionId}/roles`
  }

  canEdit() {
    return this.name === 'editor' || this.name === 'admin'
  }

  API_delete(entity, opts = {}) {
    return this.apiStore.request(
      `${entity.internalType}/${entity.id}/roles/${this.id}`,
      'DELETE',
      { is_switching: opts.isSwitching }
    )
      .then(res => {
        if (!this.resource.groupRoles.length) return res
        const resRoleIds = res.data.map(role => role.id)
        const deletedRole = this.resource.groupRoles.find(role =>
          resRoleIds.indexOf(role.id) === -1)
        if (deletedRole) this.apiStore.remove('roles', deletedRole.id)
        return res
      })
  }

  API_create() {
    // TODO why can't the API figure out where name is if calling toJsonApi?
    return this.apiStore.request(`collections/${this.resourceId}/roles`,
      'POST',
      {
        role: {
          name: this.name
        },
        user_ids: this.users.map((user) => user.id)
      })
  }
}
Role.type = 'roles'

Role.defaults = {
  // set as array so it's never `undefined`
  users: [],
  groups: [],
}

export default Role
