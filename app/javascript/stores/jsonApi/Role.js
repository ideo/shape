import BaseRecord from './BaseRecord'

class Role extends BaseRecord {
  static endpoint(collectionId) {
    return `collections/${collectionId}/roles`
  }

  canEdit() {
    return this.name === 'editor' || this.name === 'admin'
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
