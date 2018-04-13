import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']

  API_archive() {
    return this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
  }
}

Group.type = 'groups'

export default Group
