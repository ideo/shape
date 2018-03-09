import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  get name() {
    return [this.first_name, this.last_name].join(' ')
  }
}
User.type = 'users'

export default User
