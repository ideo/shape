import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  API_archive() {
    return this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
  }
}

Group.type = 'groups'

export default Group
