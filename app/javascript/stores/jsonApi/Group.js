import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  static type = 'groups'
  static endpoint = apiUrl('groups')

  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']

  get isNormalGroup() {
    return !this.isOrgGroup
  }

  get isGuestOrAdmin() {
    return this.is_guest || this.is_admin
  }

  get isOrgGroup() {
    return this.is_primary || this.is_guest || this.is_admin
  }

  API_fetch() {
    const fetchGroups = async () => {
      await this.apiStore.request(`groups/`, 'GET')
    }

    fetchGroups()
  }

  API_archive() {
    const onAgree = async () => {
      await this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
      const roleForCurrentUser = role =>
        role.users.find(user => user.id === this.apiStore.currentUserId)
      if (this.roles.find(roleForCurrentUser)) {
        window.location.reload()
      } else {
        this.apiStore.loadCurrentUser()
      }
    }
    this.uiStore.confirm({
      prompt: 'Are you sure you want to delete this group?',
      confirmText: 'Delete',
      iconName: 'Trash',
      onConfirm: onAgree,
    })
    return onAgree
  }
}

// Group.refDefaults = {
//   roles: {
//     model: Role,
//     type: ReferenceType.TO_MANY,
//     defaultValue: [],
//   },
// }

export default Group
