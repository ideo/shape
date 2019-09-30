import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Comment from '~/ui/threads/Comment'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import CommentReplies from '~/ui/threads/CommentReplies'
import { Element as ScrollElement } from 'react-scroll'

@inject('uiStore')
@observer
class CommentThread extends React.Component {
  renderComments = () => {
    const { thread, uiStore } = this.props
    const { comments } = thread
    if (!comments || comments.length <= 0) return []
    const commentsList = []
    _.each(comments, (comment, i) => {
      const expanded = uiStore.replyingToCommentId === comment.id
      commentsList.push(
        <Comment
          key={comment.id || `comment-new-${i}`}
          comment={comment}
          expanded={expanded}
        />
      )
      if (comment.id) {
        commentsList.push(
          <CommentReplies
            key={`comment-replies-${comment.id}`}
            comment={comment}
            expanded={expanded}
          />
        )
      }

      // render the reply level entry form when replying
      if (expanded) {
        commentsList.push(this.renderCommentEntryForm())
      }

      commentsList.push(
        <ScrollElement
          key={`${comment.id}-replies-bottom`}
          name={`${comment.id}-replies-bottom`}
        />
      )
    })
    return commentsList
  }

  renderCommentEntryForm = () => {
    const { thread } = this.props
    return (
      <CommentEntryForm
        key={'comment-entry-form'}
        thread={thread}
        afterSubmit={this.props.afterSubmit}
        onHeightChange={this.props.onEditorHeightChange}
      />
    )
  }

  render() {
    const { thread, uiStore } = this.props

    return (
      <div>
        <CommentThreadHeader thread={thread} sticky />
        <div className="comments">
          {thread.hasMore && <CommentThreadLoader thread={thread} />}
          {this.renderComments()}
        </div>
        {/* render the top level entry form */}
        {!uiStore.replyingToCommentId && this.renderCommentEntryForm()}
      </div>
    )
  }
}

CommentThread.propTypes = {
  afterSubmit: PropTypes.func.isRequired,
  onEditorHeightChange: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentThread.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CommentThread.defaultProps = {
  expanded: false,
}

CommentThread.displayName = 'CommentThread'

export default CommentThread
