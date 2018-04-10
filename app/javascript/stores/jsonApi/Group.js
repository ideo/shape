import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  API_archive() {
    return this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
  }

  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']
  API_archive() {
    return this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
  }

  containsUser(userId) {
    return (
      this.roles.find(role => role.users.find(user => user.id === userId))
    ).length > 0
  }
}

Group.type = 'groups'

export default Group
