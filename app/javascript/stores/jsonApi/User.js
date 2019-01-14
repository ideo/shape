import { routingStore, uiStore } from '~/stores'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

/* global IdeoSSO */

class User extends BaseRecord {
  static type = 'users'
  static endpoint = apiUrl('users')

  get name() {
    const nameDisplay = [this.first_name, this.last_name].join(' ')
    return nameDisplay.trim() || this.email
  }

  get nameWithHints() {
    const hints = []
    if (this.isCurrentUser) {
      hints.push('(you)')
    }
    if (this.status === 'pending') {
      hints.push('(pending)')
    }
    return [this.name, ...hints].join(' ').trim()
  }

  get isCurrentUser() {
    return this.apiStore.currentUserId === this.id
  }

  async logout() {
    const { apiStore } = this
    await apiStore.request('/sessions', 'DELETE')
    try {
      // Log user out of IDEO network, back to homepage
      await IdeoSSO.logout('/')
    } catch (e) {
      window.location = '/login'
    }
  }

  async API_updateCurrentUser(option = {}) {
    try {
      return await this.apiStore.request('users/update_current_user', 'PATCH', {
        user: option,
      })
    } catch (e) {
      uiStore.defaultAlertError()
      return e
    }
  }

  API_acceptTerms({ mailing_list = false }) {
    return this.API_updateCurrentUser({
      terms_accepted: true,
      mailing_list,
    })
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
      this.apiStore.update('switchingOrgs', true)
      await this.apiStore.request('users/switch_org', 'POST', {
        organization_id: organizationId,
      })
      await this.apiStore.loadCurrentUser()
      this.apiStore.update('switchingOrgs', false)
      if (redirectPath) {
        routingStore.routeTo(redirectPath, redirectId)
      }
    } catch (e) {
      if (e.status === 404 || e.status === 401) {
        routingStore.routeTo('homepage')
      }
    }
  }
}

export default User
