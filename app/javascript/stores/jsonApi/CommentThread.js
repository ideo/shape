import { observable, action, computed, runInAction } from 'mobx'
import _ from 'lodash'
import { ReferenceType } from 'datx'

import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'
import Comment from './Comment'
import Item from './Item'
import Collection from './Collection'
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
  get key() {
    // include persisted as part of the key,
    // because when we .save() the unpersisted and persisted both temporarily exist
    if (!this.record) return 'none'
    return `thread-${this.record.className}-${this.record.id}${
      this.persisted ? '' : '-new'
    }`
  }

  get containerId() {
    return `ct-container-${this.key}`
  }

  // don't want @computed here... for some reason this seemed to actually
  // break the observability (probably because it's on a related record?)
  get unreadCount() {
    const { users_thread } = this
    if (!users_thread) return 0
    return users_thread.unread_count
  }

  // returns visible comments and their replies to help compute the height of the container
  get visibleCommentsAndRepliesCount() {
    let count = this.comments.length
    _.each(this.comments, comment => {
      count += comment.replies.length
    })
    return count
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
    if (!this.persisted) return

    const { apiStore } = this
    // always fire an async request to markViewed
    this.API_markViewed()

    const page = next ? this.links.next : 1
    // if we had previously loaded additional pages, return it to the state
    // where we just have the first page worth of comments
    runInAction(() => {
      if (page === 1 && this.comments.length > PER_PAGE) {
        this.comments.replace(this.comments.toJS().slice(PER_PAGE * -1))
      }
      apiStore.update('loadingThreads', true)
    })
    const apiPath = `comment_threads/${this.id}/comments?page=${page}`
    try {
      const res = await this.apiStore.request(apiPath, 'GET')
      runInAction(() => {
        this.links = res.links
        this.importComments(res.data)
        apiStore.update('loadingThreads', false)
      })
    } catch {
      // just gracefully ignore (e.g. on dev where it's a thread you don't have access to)
      apiStore.update('loadingThreads', false)
    }
  }

  async API_saveComment(commentData) {
    const { apiStore, uiStore } = this
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
    apiStore.addCurrentCommentThread(this.id)
    // simulate the updated_at update so that the thread will move to most recent
    this.updated_at = new Date()

    const { commentingOnRecord } = uiStore
    if (commentingOnRecord) {
      commentData.subject_id = commentingOnRecord.id
      commentData.subject_type = commentingOnRecord.type
    }

    // dynamically set the endpoint to belong to this thread
    Comment.endpoint = apiUrl(`comment_threads/${this.id}/comments`)
    // create an unsaved comment so that we can see it immediately
    const comment = new Comment(commentData, apiStore)
    comment.addReference('author', apiStore.currentUser, {
      model: User,
      type: ReferenceType.TO_ONE,
    })
    if (commentingOnRecord) {
      comment.addReference('subject', commentingOnRecord, {
        model: commentingOnRecord.isCollection ? Collection : Item,
        type: ReferenceType.TO_ONE,
      })
    }

    // also store the author_id to simulate the serializer
    comment.author_id = apiStore.currentUserId
    if (commentData.parent_id) {
      // will trigger rerender for parent comments that just got a reply
      const parent = apiStore.find('comments', commentData.parent_id)
      if (parent) {
        parent.replies_count += 1
        if (parent.status === 'resolved') {
          parent.status = 'reopened'
        }
      }
    }

    this.importComments([comment], { created: true })
    uiStore.trackEvent('create', this.record)
    // this will create the comment in the API
    await comment.save()
    this.afterCommentCreate(comment)

    return comment
  }

  async afterCommentCreate(comment) {
    const { uiStore } = this
    const { commentingOnRecord, currentQuillEditor } = uiStore
    if (!comment.persisted || !commentingOnRecord) {
      uiStore.setCommentingOnRecord(null)
      return
    }
    if (commentingOnRecord.isCollection) {
      // increment unresolved count by 1 for collection cover to get recent count
      commentingOnRecord.unresolved_count =
        commentingOnRecord.unresolved_count + 1
      uiStore.setCommentingOnRecord(null)
      return
    }
    if (uiStore.isCommentingOnTextRange() && currentQuillEditor) {
      // set this now as it won't be present until the text item has saved
      comment.text_highlight = uiStore.selectedTextRangeForCard.textContent
      // capture contents so that we can now safely set commentingOnRecord to false (???)
      const delta = currentQuillEditor.getContents()
      uiStore.setCommentingOnRecord(null, { persisted: true })
      await commentingOnRecord.API_persistHighlight({
        commentId: comment.id,
        delta,
      })
    } else {
      // just clear this out; e.g. you commented on a record but not a highlight
      uiStore.setCommentingOnRecord(null)
    }
  }

  API_markViewed() {
    const { apiStore } = this
    if (!this.persisted || apiStore.loadingThreads) {
      return false
    }
    const apiPath = `comment_threads/${this.id}/view`
    if (this.users_thread) {
      // simulate backend effect
      this.users_thread.unread_count = 0
    }
    return apiStore.request(apiPath, 'POST')
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
      // after we're done creating the temp comment, clear out any prev temp ones
      newComments = _.filter(mergedComments, c => c.persisted)
    }
    this.comments.replace(_.sortBy(newComments, ['created_at']))
    this.importRepliesFromParentComments(newReplies, newComments)
  }

  async importRepliesFromParentComments(replies, comments) {
    replies.forEach(reply => {
      parent = _.find(comments, { id: reply.parent_id.toString() })
      if (parent) {
        // NOTE: could check if this is a "new" reply, and bump replies_count
        parent.importReplies([reply])
      }
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
