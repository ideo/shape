import { observable, action, computed } from 'mobx'
import _ from 'lodash'

import { uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class CommentThread extends BaseRecord {
  @observable comments = []

  @computed get key() {
    // include __persisted as part of the key,
    // because when we .save() the unpersisted and persisted both temporarily exist
    return `thread-${this.record.className}-${this.record.id}${this.__persisted ? '' : '-new'}`
  }

  @computed get unreadCount() {
    const { users_thread } = this
    if (!users_thread) return 0
    return users_thread.unread_count
  }

  @computed get latestUnreadComments() {
    const { users_thread } = this
    if (!users_thread) return []
    if (users_thread.unread_count === 0) return []
    // get latest 3
    let comments = this.comments.slice(-3)
    // only return ones that are unread
    comments = _.filter(comments, comment => (
      comment.updated_at > users_thread.last_viewed_at
    ))
    return comments
  }

  async API_create() {
    try {
      await this.save()
      // now that we have a real id, update what's expanded
      uiStore.expandThread(this.key, { reset: false })
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_fetchComments({ page = 1 } = {}) {
    const apiPath = `comment_threads/${this.id}/comments?page=${page}`
    // simulate backend effect
    this.comments.forEach(comment => comment.markAsRead())
    this.users_thread.unread_count = 0
    const res = await this.apiStore.request(apiPath, 'GET')
    this.importComments(res.data)
  }

  async API_saveComment(message) {
    if (!this.__persisted) {
      // if there's no id, then first we have to create the comment_thread
      await this.API_create()
      if (!this.__persisted) {
        // error if that still didn't work...
        return
      }
    }
    // make sure we're following this thread in our activity log
    this.apiStore.addCurrentCommentThread(this.id)
    const apiPath = `comment_threads/${this.id}/comments`
    // this will create the comment and retrieve the updated thread
    const res = await this.apiStore.request(apiPath, 'POST', { message })
    const comment = res.data
    // simulate the updated_at update so that the thread will move to most recent
    this.updated_at = new Date()
    if (this.users_thread) this.users_thread.last_viewed_at = new Date()
    this.importComments([comment])
  }

  API_markViewed() {
    const apiPath = `comment_threads/${this.id}/view`
    // simulate backend effect
    this.comments.forEach(comment => comment.markAsRead())
    this.users_thread.unread_count = 0
    return this.apiStore.request(apiPath, 'POST')
  }

  @action importComments(data) {
    let newComments = _.union(this.comments.toJS(), data)
    data.forEach(comment => {
      const { users_thread } = this
      if (comment.author_id !== this.apiStore.currentUserId &&
          users_thread &&
          comment.updated_at > users_thread.last_viewed_at) {
        comment.markAsUnread()
      }
    })
    newComments = _.sortBy(newComments, ['updated_at'])
    this.lastUnread = _.last(newComments)
    this.comments.replace(newComments)
  }
}

CommentThread.type = 'comment_threads'

CommentThread.defaults = {
  unread_comments: [],
}

export default CommentThread
