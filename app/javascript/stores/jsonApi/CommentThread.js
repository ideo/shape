import { uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class CommentThread extends BaseRecord {
  async API_create() {
    try {
      // get rid of fake id we assigned
      this.id = null
      this.assignRef('record', null)
      await this.save()
      // now that we have a real id, update what's expanded
      uiStore.update('expandedThread', this.id)
    } catch (e) {
      uiStore.defaultAlertError()
    }
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
    const apiPath = `comment_threads/${this.id}/comments`
    // this will create the comment and retrieve the updated thread
    await this.apiStore.request(apiPath, 'POST', { message })
  }
}

CommentThread.type = 'comment_threads'

CommentThread.defaults = {
  // set as array so it's never `undefined`
  comments: [],
}

export default CommentThread
