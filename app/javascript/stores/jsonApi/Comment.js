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
      console.log(e)
      uiStore.defaultAlertError()
    }
  }
}

Comment.defaults = {
  draftjs_data: {},
}

export default Comment
