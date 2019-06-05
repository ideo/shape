import { uiStore } from '~/stores'
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

  API_acceptFeedbackTerms() {
    return this.API_updateCurrentUser({
      feedback_terms_accepted: true,
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
}

export default User
