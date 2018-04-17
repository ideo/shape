import BaseRecord from './BaseRecord'

class Group extends BaseRecord {
  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']

  get groupRoles() {
    const { apiStore } = this
    // Some roles in the Api store don't have a resource included
    return apiStore.findAll('roles').filter(role =>
      role.resource && role.resource.id === this.id)
  }

  get currentUserCanEdit() {
    const { apiStore } = this
    // If the current user is an admin in the group they can edit
    const { currentUser } = apiStore
    const userRole = this.groupRoles.find(role =>
      role.users.find(user => user.id === currentUser.id))
    if (!userRole) return false
    return userRole.canEdit()
  }

  API_archive() {
    return this.apiStore.request(`groups/${this.id}/archive`, 'PATCH')
  }
}

Group.type = 'groups'

export default Group
