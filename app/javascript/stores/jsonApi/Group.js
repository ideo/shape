import BaseRecord from './BaseRecord'
import Api from './Api'

class Group extends BaseRecord {
  API_archive() {
    return this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
  }

  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']
  API_archive() {
    return Api.archive('groups', this)
  }
}

Group.type = 'groups'

export default Group
