import { observable, action, runInAction } from 'mobx'
import { remove } from 'lodash'

import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'
import { apiStore, uiStore } from '~/stores'

class Comment extends BaseRecord {
  static type = 'comments'
  static endpoint = apiUrl('comments')

  @observable
  unread = false

  @action
  markAsUnread() {
    this.unread = true
  }

  @action
  markAsRead() {
    this.unread = false
  }

  API_destroy = async () => {
    try {
      await this.destroy()
      const thread = apiStore.find('comment_threads', this.comment_thread_id)
      runInAction(() => {
        remove(thread.comments, comment => comment.id === this.id)
      })
    } catch (e) {
      console.error(e)
      uiStore.defaultAlertError()
    }
  }

  API_updateWithoutSync = rawData => {
    this.message = rawData.message
    this.draftjs_data = rawData.draftjs_data

    const data = this.toJsonApi()
    // Turn off syncing when saving the comment to not reload the page
    data.cancel_sync = true
    return apiStore
      .request(`comments/${this.id}`, 'PATCH', {
        data,
      })
      .catch(err => {
        trackError(err, { name: 'comment:update' })
      })
  }
}

Comment.defaults = {
  draftjs_data: {},
}

export default Comment
