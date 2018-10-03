import { routingStore, uiStore } from '~/stores'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  static type = 'users'
  static endpoint = apiUrl('users')

  get name() {
    return [this.first_name, this.last_name].join(' ')
  }

  get isCurrentUser() {
    return this.apiStore.currentUserId === this.id
  }

  async API_updateCurrentUser(option) {
    try {
      return await this.apiStore.request('users/update_current_user', 'PATCH', {
        user: option,
      })
    } catch (e) {
      uiStore.defaultAlertError()
      return e
    }
  }

  API_acceptTerms() {
    return this.API_updateCurrentUser({ terms_accepted: true })
  }

  API_hideHelper(type = '') {
    let show_helper = 'show_helper'
    if (['template', 'move'].indexOf(type) > -1) {
      show_helper = `show_${type}_helper`
    }
    // set it ahead of time so the helper immediately disappears
    this[show_helper] = false
    return this.API_updateCurrentUser({ [show_helper]: false })
  }

  API_hideMoveHelper() {
    return this.API_updateCurrentUser({ show_move_helper: false })
  }

  async switchOrganization(
    organizationId,
    { redirectPath = null, redirectId = null } = {}
  ) {
    try {
      await this.apiStore.request('users/switch_org', 'POST', {
        organization_id: organizationId,
      })
      await this.apiStore.loadCurrentUserAndGroups()
      if (redirectPath) {
        routingStore.routeTo(redirectPath, redirectId)
      }
    } catch (e) {
      if (e.status === 404) {
        routingStore.routeTo('homepage')
      }
    }
  }
}

export default User
