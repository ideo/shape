import { observable, action } from 'mobx'
import BaseRecord from './BaseRecord'

class Comment extends BaseRecord {
  @observable unread = false

  @action markAsUnread() {
    this.unread = true
  }

  @action markAsRead() {
    this.unread = false
  }
}

Comment.type = 'comments'

export default Comment
