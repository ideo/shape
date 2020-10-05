import { action, runInAction } from 'mobx'
import localStorage from 'mobx-localstorage'

import { uiStore } from '~/stores'
import { apiUrl } from '~/utils/url'
import IdeoSSO from '~/utils/IdeoSSO'

import BaseRecord from './BaseRecord'

export const USER_MOST_USED_TEMPLATES = 'UserMostUsedTemplates'

class User extends BaseRecord {
  static type = 'users'
  static endpoint = apiUrl('users')

  constructor(...args) {
    super(...args)
    if (this.isCurrentUser) {
      runInAction(() => {
        localStorage.setItem(USER_MOST_USED_TEMPLATES, this.most_used_templates)
      })
    }
  }

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
      return Promise.reject(e)
    }
  }

  async API_updateSurveyRespondent(session_uid, option = {}) {
    try {
      return await this.apiStore.request(
        'users/update_survey_respondent',
        'PATCH',
        {
          session_uid,
          user: option,
        }
      )
    } catch (e) {
      uiStore.defaultAlertError()
      return Promise.reject(e)
    }
  }

  async API_acceptCurrentOrgTerms() {
    try {
      return await this.apiStore.request(
        'users/accept_current_org_terms',
        'PATCH'
      )
    } catch (e) {
      uiStore.defaultAlertError()
      return Promise.reject(e)
    }
  }

  API_acceptFeedbackTerms() {
    return this.API_updateCurrentUser({
      feedback_terms_accepted: true,
    })
  }

  API_updateUseTemplateSetting(useTemplateSetting = null) {
    if (!useTemplateSetting) return

    // set it ahead of time so the helper immediately disappears
    this.show_template_helper = false

    return this.API_updateCurrentUser({
      show_template_helper: false,
      use_template_setting: useTemplateSetting,
    })
  }

  API_hideMoveHelper() {
    // set it ahead of time so the helper immediately disappears
    this.show_move_helper = false
    return this.API_updateCurrentUser({ show_move_helper: false })
  }

  @action
  useTemplate(templateId) {
    const templateIds = localStorage.getItem(USER_MOST_USED_TEMPLATES)
    localStorage.setItem(USER_MOST_USED_TEMPLATES, [templateId, ...templateIds])
  }
}

export default User
