import { observable, action, computed, runInAction } from 'mobx'
import _ from 'lodash'

import { uiStore } from '~/stores'
import BaseRecord from './BaseRecord'
import Comment from './Comment'

// should always be the same as paginates_per in comment.rb
const PER_PAGE = 50

class CommentThread extends BaseRecord {
  @observable comments = []
  @observable links = {}

  @computed get key() {
    // include __persisted as part of the key,
    // because when we .save() the unpersisted and persisted both temporarily exist
    if (!this.record) return 'none'
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
    comments = _.filter(comments, comment => comment.unread)
    return comments
  }

  @computed get hasMore() {
    // if there is a "next" page link that means there are more comments
    return !!this.links.next
  }

  async API_create() {
    try {
      await this.save()
      // now that we have a real id, update what's expanded
      uiStore.expandThread(this.key, { reset: false })
      uiStore.trackEvent('create', this.record)
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  // use next param to get the "next page" of comments
  async API_fetchComments({ next = false } = {}) {
    const page = next ? this.links.next : 1
    // if we had previously loaded additional pages, return it to the state
    // where we just have the first page worth of comments
    if (page === 1 && this.comments.length > PER_PAGE) {
      this.comments.replace(
        this.comments.toJS().slice(PER_PAGE * -1)
      )
    }
    const apiPath = `comment_threads/${this.id}/comments?page=${page}`
    const res = await this.apiStore.request(apiPath, 'GET')
    runInAction(() => { this.links = res.links })
    this.importComments(res.data)
  }

  async API_saveComment(commentData) {
    if (!this.__persisted) {
      // if there's no id, then first we have to create the comment_thread
      await this.API_create()
      if (!this.__persisted) {
        // error if that still didn't work...
        return false
      }
    }
    // can just call this without awaiting the result
    this.API_markViewed()
    // make sure we're following this thread in our activity log
    this.apiStore.addCurrentCommentThread(this.id)
    // simulate the updated_at update so that the thread will move to most recent
    this.updated_at = new Date()
    // dynamically set the endpoint to belong to this thread
    Comment.endpoint = `comment_threads/${this.id}/comments`
    // create an unsaved comment so that we can see it immediately
    const comment = new Comment(commentData, this.apiStore)
    comment.assignRef('author', this.apiStore.currentUser)
    this.apiStore.add(comment)
    this.importComments([comment], { created: true })
    // this will create the comment in the API
    uiStore.trackEvent('create', this.record)
    return comment.save()
  }

  API_markViewed() {
    const apiPath = `comment_threads/${this.id}/view`
    // simulate backend effect
    this.comments.forEach(comment => comment.markAsRead())
    if (this.users_thread) {
      this.users_thread.unread_count = 0
    }
    return this.apiStore.request(apiPath, 'POST')
  }

  @action importComments(data, { created = false } = {}) {
    let newComments = _.union(this.comments.toJS(), data)
    // after we're done creating the temp comment, clear out any prev temp ones
    if (!created) newComments = _.filter(newComments, c => c.id)
    data.forEach(comment => {
      const { users_thread } = this
      if (comment.author_id !== this.apiStore.currentUserId &&
          users_thread &&
          comment.updated_at > users_thread.last_viewed_at) {
        comment.markAsUnread()
      }
    })
    newComments = _.sortBy(newComments, ['updated_at'])
    this.comments.replace(newComments)
  }
}

CommentThread.type = 'comment_threads'

CommentThread.defaults = {
  unread_comments: [],
  // Set this undefined by default so assignRef will pick up the change
  users_thread: undefined,
}

export default CommentThread
