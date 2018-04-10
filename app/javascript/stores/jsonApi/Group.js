import BaseRecord from './BaseRecord'
import Api from './Api'

class Group extends BaseRecord {
  API_archive() {
    return Api.archive('groups', this)
  }
}

Group.type = 'groups'

export default Group
