import { uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']

  get groupRoles() {
    const { apiStore } = this
    // Some roles in the Api store don't have a resource included
    return apiStore.findAll('roles').filter(role =>
      role.resource && role.resource.id === this.id)
  }

  get isNormalGroup() {
    return !this.is_primary && !this.is_guest
  }

  API_archive() {
    const onAgree = async () => {
      await this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
      const roles = this.apiStore.findAll('roles').filter((role) =>
        role.resource && role.resource.id === this.id)
      if (roles.find(role => role.users.find(user => user.id ===
          this.apiStore.currentUserId))) {
        window.location.reload()
      }
      this.apiStore.fetch('users', this.apiStore.currentUserId, true)
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
