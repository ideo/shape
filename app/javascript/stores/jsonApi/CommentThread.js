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
    this.apiStore.addCurrentUserThread(this.id)
    const apiPath = `comment_threads/${this.id}/comments`
    // this will create the comment and retrieve the updated thread
    const res = await this.apiStore.request(apiPath, 'POST', { message })
    const comment = res.data
    // simulate the updated_at update so that the thread will move to most recent
    this.updated_at = new Date()
    this.importComments([comment])
  }

  @action importComments(data) {
    const newComments = _.union(this.comments.toJS(), data)
    this.comments.replace(newComments)
  }
}

CommentThread.type = 'comment_threads'

export default CommentThread
