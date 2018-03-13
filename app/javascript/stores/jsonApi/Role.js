import BaseRecord from './BaseRecord'

class Role extends BaseRecord {
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

export default Role
