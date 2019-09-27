import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Comment from '~/ui/threads/Comment'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import CommentReplies from '~/ui/threads/CommentReplies'

const StyledCommentsWrapper = styled.div`
  margin-top: 5px;
`
StyledCommentsWrapper.displayName = 'StyledCommentsWrapper'

@inject('uiStore')
@observer
class CommentThread extends React.Component {
  @observable
  comments = []

  componentDidMount() {
    const { thread } = this.props
    const { comments } = thread
    // TODO: where should we place this logic now that replies are a thing
    // for un-expanded thread, only take the unread comments
    // if (!expanded) {
    // comments = thread.latestUnreadComments
    // return []
    // }
    runInAction(() => {
      this.comments = comments
    })
  }

  renderComments = () => {
    const { uiStore } = this.props
    if (!this.comments || this.comments.length <= 0) return []
    const commentsList = []
    _.each(this.comments, (comment, i) => {
      commentsList.push(
        <Comment key={comment.id || `comment-new-${i}`} comment={comment} />
      )
      if (comment.id) {
        commentsList.push(
          <CommentReplies
            key={`comment-replies-${comment.id}`}
            comment={comment}
            commentEntryForm={this.renderCommentEntryForm}
            replying={uiStore.replyingToCommentId === comment.id}
          />
        )
      }
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
        {/* TODO: this `0 10px` is because we moved that out of the overall ActivityContainer */}
        <div style={{ padding: '0 10px' }}>
          <StyledCommentsWrapper className="comments">
            {thread.hasMore && <CommentThreadLoader thread={thread} />}
            {this.renderComments()}
          </StyledCommentsWrapper>
          {/* render the top level entry form */}
          {!uiStore.replyingToCommentId && this.renderCommentEntryForm()}
        </div>
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
