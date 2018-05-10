import { routingStore, uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  get name() {
    return [this.first_name, this.last_name].join(' ')
  }

  get isCurrentUser() {
    return this.apiStore.currentUserId === this.id
  }

  async API_acceptTerms() {
    try {
      return await this.apiStore.request('users/accept_terms', 'POST')
    } catch (e) {
      uiStore.defaultAlertError()
      return e
    }
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
