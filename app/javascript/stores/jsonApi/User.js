import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  canEditCollection(collectionId) {
    let perms = false
    this.roles.forEach(role => {
      if (role.canEdit() && role.users.find(u => u.id === this.id).length) {
        perms = true
      }
    })
    return perms
  }

  get name() {
    return [this.first_name, this.last_name].join(' ')
  }
}
User.type = 'users'

export default User
