import { uiStore } from '~/stores'
import { apiUrl } from '~/utils/url'
import { ReferenceType } from 'datx'

import Role from './Role'
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
    uiStore.confirm({
      prompt: 'Are you sure you want to archive this group?',
      confirmText: 'Archive',
      iconName: 'Archive',
      onConfirm: onAgree,
    })
    return onAgree
  }
}

Group.refDefaults = {
  roles: {
    model: Role,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Group
