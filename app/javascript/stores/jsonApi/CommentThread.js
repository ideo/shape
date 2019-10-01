import { observable, action, computed, runInAction } from 'mobx'
import _ from 'lodash'
import v from '~/utils/variables'
import { ReferenceType } from 'datx'

import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import Comment from './Comment'
import UsersThread from './UsersThread'
import User from './User'

// should always be the same as paginates_per in comment.rb
const PER_PAGE = 50

class CommentThread extends BaseRecord {
  static type = 'comment_threads'
  static endpoint = apiUrl('comment_threads')

  @observable
  comments = []
  @observable
  links = {}
  @computed
  get viewingCommentThread() {
    const { uiStore } = this
    return (
      uiStore.activityLogOpen &&
      uiStore.activityLogPage === 'comments' &&
      uiStore.expandedThreadKey === this.key
    )
  }

  @computed
  get key() {
    // include persisted as part of the key,
    // because when we .save() the unpersisted and persisted both temporarily exist
    if (!this.record) return 'none'
    return `thread-${this.record.className}-${this.record.id}${
      this.persisted ? '' : '-new'
    }`
  }

  // don't want @computed here... for some reason this seemed to actually
  // break the observability (probably because it's on a related record?)
  get unreadCount() {
    const { users_thread } = this
    if (!users_thread) return 0
    return users_thread.unread_count
  }

  @computed
  get latestUnreadComments() {
    const { users_thread } = this
    if (!users_thread) return []
    if (users_thread.unread_count === 0) return []
    // get latest 3
    let comments = this.comments.slice(-3)
    // only return ones that are unread
    comments = _.filter(comments, comment => comment.unread)
    return comments
  }

  @computed
  get hasMore() {
    // if there is a "next" page link that means there are more comments
    return !!this.links.next
  }

  async API_create() {
    const { uiStore } = this
    try {
      await this.create()
      // now that we have a real id, update what's expanded
      uiStore.expandThread(this.key, { reset: false })
      uiStore.trackEvent('create', this.record)
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  // use next param to get the "next page" of comments
  async API_fetchComments({ next = false } = {}) {
    // always fire an async request to markViewed
    this.API_markViewed()

    const page = next ? this.links.next : 1
    // if we had previously loaded additional pages, return it to the state
    // where we just have the first page worth of comments
    if (page === 1 && this.comments.length > PER_PAGE) {
      this.comments.replace(this.comments.toJS().slice(PER_PAGE * -1))
    }
    const apiPath = `comment_threads/${this.id}/comments?page=${page}`
    const res = await this.apiStore.request(apiPath, 'GET')
    runInAction(() => {
      this.links = res.links
    })
    this.importComments(res.data)
  }

  async API_saveComment(commentData) {
    if (!this.persisted) {
      // if there's no id, then first we have to create the comment_thread
      await this.API_create()
      if (!this.persisted) {
        // error if that still didn't work...
        return false
      }
      // you would only ever be creating a new thread on the current page
      // so update the currentPageThreadKey to match the new persisted key
      this.apiStore.setCurrentPageThreadKey(this.key)
    }
    // can just call this without awaiting the result
    this.API_markViewed()
    // make sure we're following this thread in our activity log
    this.apiStore.addCurrentCommentThread(this.id)
    // simulate the updated_at update so that the thread will move to most recent
    this.updated_at = new Date()
    // dynamically set the endpoint to belong to this thread
    Comment.endpoint = apiUrl(`comment_threads/${this.id}/comments`)
    // create an unsaved comment so that we can see it immediately
    const comment = new Comment(commentData, this.apiStore)
    comment.addReference('author', this.apiStore.currentUser, {
      model: User,
      type: ReferenceType.TO_ONE,
    })
    // also store the author_id to simulate the serializer
    comment.author_id = this.apiStore.currentUserId
    this.importComments([comment], { created: true })
    // this will create the comment in the API
    this.uiStore.trackEvent('create', this.record)
    return comment.save()
  }

  API_markViewed() {
    if (!this.persisted) return false
    const apiPath = `comment_threads/${this.id}/view`
    // this.comments.forEach(comment => comment.markAsRead())
    if (this.users_thread) {
      // simulate backend effect
      this.users_thread.unread_count = 0
    }
    return this.apiStore.request(apiPath, 'POST')
  }

  API_subscribe() {
    const apiPath = `comment_threads/${this.id}/subscribe`
    return this.apiStore.request(apiPath, 'PATCH')
  }

  API_unsubscribe() {
    const apiPath = `comment_threads/${this.id}/unsubscribe`
    return this.apiStore.request(apiPath, 'PATCH')
  }

  @action
  async importComments(data, { created = false } = {}) {
    const newParentComments = _.filter(data, c => !c.parent_id)
    const newReplies = _.filter(data, c => c.parent_id)
    const mergedComments = _.union(this.comments.toJS(), newParentComments)
    let newComments = mergedComments
    if (!created) {
      newComments = _.filter(mergedComments, c => c.persisted)
      const canMarkParentAsRead =
        !_.isEmpty(newParentComments) && _.isEmpty(newReplies)
      if (canMarkParentAsRead) {
        // when parent comments
        this.markAsRead()
      }
    }

    this.comments.replace(_.sortBy(newComments, ['created_at']))
    this.importRepliesFromParentComments(newReplies, newComments)
  }

  async importRepliesFromParentComments(replies, comments) {
    replies.forEach(reply => {
      parent = _.find(comments, { id: reply.parent_id.toString() })
      if (parent) parent.importReplies([reply])
    })
  }

  markAsRead = async () => {
    const { uiStore } = this
    // don't mark as read if coment thread is not currently in view or user is replying
    if (!this.viewingCommentThread || uiStore.replyingToCommentId) {
      return
    }
    await this.API_markViewed()
    const newestComment = _.last(this.comments)
    uiStore.scroller.scrollTo(`${newestComment.id}-replies-bottom`, {
      ...v.commentScrollOpts,
      offset:
        -1 *
          document.getElementById(v.commentScrollOpts.containerId)
            .clientHeight +
        50,
    })
  }
}

CommentThread.refDefaults = {
  users_thread: {
    model: UsersThread,
    type: ReferenceType.TO_ONE,
    defaultValue: null,
  },
}

export default CommentThread
