import BaseRecord from './BaseRecord'

class CommentThread extends BaseRecord {
  get identifier() {
    return `thread-${this.id}`
  }

  async API_saveComment(message) {
    // if (!this.id) {
    //   await this.save()
    // }
    const apiPath = `comment_threads/${this.id}/comments`
    // this will create the comment and retrieve the updated thread
    await this.apiStore.request(apiPath, 'POST', { message })
  }
}

CommentThread.type = 'comment_threads'

export default CommentThread
