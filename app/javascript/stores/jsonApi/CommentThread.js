import BaseRecord from './BaseRecord'

class CommentThread extends BaseRecord {
  get identifier() {
    return `thread-${this.id}`
  }
}

CommentThread.type = 'comment_threads'

export default CommentThread
