import { routingStore, uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  get name() {
    return [this.first_name, this.last_name].join(' ')
  }

  get isCurrentUser() {
    return this.apiStore.currentUserId === this.id
  }

  async API_updateCurrentUser(option) {
    try {
      return await this.apiStore.request(
        'users/update_current_user', 'PATCH', { user: option }
      )
    } catch (e) {
      uiStore.defaultAlertError()
      return e
    }
  }

  API_acceptTerms() {
    return this.API_updateCurrentUser({ terms_accepted: true })
  }

  API_hideHotEdgeHelper() {
    return this.API_updateCurrentUser({ show_helper: false })
  }

  async switchOrganization(organizationId, { backToHomepage = false } = {}) {
    await this.apiStore.request(
      'users/switch_org',
      'POST',
      { organization_id: organizationId }
    )
    await this.apiStore.loadCurrentUserGroups()
    if (backToHomepage) {
      routingStore.routeTo('/')
    }
  }
}
User.type = 'users'

export default User
