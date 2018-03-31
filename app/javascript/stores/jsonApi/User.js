import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  get name() {
    return [this.first_name, this.last_name].join(' ')
  }

  isCurrentUser() {
    return this.apiStore.currentUserId === this.id
  }
}
User.type = 'users'

export default User
