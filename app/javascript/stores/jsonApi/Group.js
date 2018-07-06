import { uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']

  // NOTE: Because we're never directly hitting the groups/{id} API endpoint,
  // group.roles relationship never gets set up.
  // However we have the related roles in the apiStore so we can just look them up.
  get groupRoles() {
    const { apiStore } = this
    return apiStore.findAll('roles').filter(
      // Some roles in the Api store don't have a resource included
      role => role.resource && role.resource === this
    )
  }

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
      const roleForCurrentUser = role => (
        role.users.find(user => user.id === this.apiStore.currentUserId)
      )
      const { groupRoles } = this
      if (groupRoles.find(roleForCurrentUser)) {
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

Group.type = 'groups'

Group.defaults = {
  // set as array so it's never `undefined`
  roles: [],
}

export default Group
