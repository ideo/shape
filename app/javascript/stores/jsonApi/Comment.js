import { observable, action } from 'mobx'

import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

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
}

Comment.defaults = {
  draftjs_data: {},
}

export default Comment
