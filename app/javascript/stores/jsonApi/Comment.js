import _ from 'lodash'
import { observable, computed, action, runInAction } from 'mobx'

import trackError from '~/utils/trackError'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'
import { apiStore, uiStore } from '~/stores'

class Comment extends BaseRecord {
  static type = 'comments'
  static endpoint = apiUrl('comments')

  attributesForAPI = ['message', 'parent_id', 'draftjs_data', 'status']

  @observable
  replies = []
  @observable
  replyPage = null

  constructor(...args) {
    super(...args)
    runInAction(() => {
      // import the first 3 that get included by the serializer
      this.importReplies(this.latest_replies)
    })
  }

  @computed
  get unread() {
    const { thread } = this
    const { users_thread } = thread

    // check if this comment was deleted
    if (!this.apiStore) return false
    return (
      // comment was written by someone else
      this.author_id.toString() !== this.apiStore.currentUserId.toString() &&
      // more recently than my last_viewed_at timestamp
      users_thread &&
      this.updated_at > users_thread.last_viewed_at
    )
  }

  get wasEdited() {
    return this.updated_at > this.created_at
  }

  get thread() {
    return apiStore.find('comment_threads', this.comment_thread_id)
  }

  @action
  importReplies(replies = []) {
    const { uiStore } = this
    let sortedReplies = _.union(this.replies, replies)
    sortedReplies = _.sortBy(sortedReplies, ['created_at'])
    this.replies.replace(sortedReplies)
    if (uiStore.replyingToCommentId !== this.id) {
      // slice back down to last 3
      this.resetReplies()
    }
  }

  @action
  resetReplies() {
    this.replyPage = null
    this.replies = this.replies.slice(-3)
  }

  API_destroy = async () => {
    try {
      await this.destroy()
      const { thread, parent_id } = this
      if (!parent_id) {
        runInAction(() => {
          _.remove(thread.comments, comment => comment.id === this.id)
        })
      } else {
        const { comments } = thread
        const parent = _.find(
          comments,
          comment => comment.id === parent_id.toString()
        )
        runInAction(() => {
          // simulate new cached count in backend
          parent.replies_count -= 1
          _.remove(parent.replies, comment => comment.id === this.id.toString())
        })
      }
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

  async expandAndFetchReplies() {
    const { uiStore } = this
    const previousReplyingToId = uiStore.replyingToCommentId
    const justExpanded = previousReplyingToId !== this.id
    // make sure this comment is expanded
    uiStore.setReplyingToComment(this.id)
    this.markThreadAsRead()
    await this.API_fetchReplies()
    if (justExpanded) {
      // if we're newly expanding, scroll to bottom
      uiStore.scrollToBottomOfComments(this.id)
    }
  }

  async API_fetchReplies() {
    // don't fetch any replies unless you need to
    if (this.replies_count > this.replies.length) {
      const replyPage = this.replyPage ? this.replyPage + 1 : 1
      const apiPath = `comments/${this.id}/replies?page=${replyPage}`
      const res = await this.apiStore.request(apiPath)
      const { data } = res
      runInAction(() => {
        if (data.length > 0) {
          this.importReplies(data)
          this.replyPage = replyPage
        }
      })
    }
  }

  markThreadAsRead = () => {
    const { uiStore } = this
    if (!uiStore.activityLogOpen) return
    return this.thread.API_markViewed()
  }
}

Comment.defaults = {
  draftjs_data: {},
}

export default Comment
