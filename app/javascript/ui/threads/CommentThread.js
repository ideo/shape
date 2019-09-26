import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Comment from '~/ui/threads/Comment'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'

const ViewMore = styled.div`
  border-left: 8px solid ${v.colors.secondaryDarkest};
  font-size: 12px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  background: ${v.colors.secondaryMedium};
  color: ${v.colors.commonDark};
  padding: 1px 0px 1px 10px;
`

ViewMore.displayName = 'ViewMore'

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

  viewMoreReplies = comment => {
    comment.API_fetchReplies()
  }

  renderComments = () => {
    const { uiStore } = this.props
    if (!this.comments || this.comments.length <= 0) return []
    const commentsList = []
    _.each(this.comments, (comment, i) => {
      commentsList.push(
        <Comment
          key={comment.id || `comment-new-${i}`}
          comment={comment}
          viewMoreReplies={this.viewMoreReplies}
        />
      )
      // total replies count minus observable replies length
      const repliesLength =
        comment.replies && comment.replies.length ? comment.replies.length : 0
      const hiddenRepliesCount = comment.replies_count - repliesLength
      if (hiddenRepliesCount > 0) {
        commentsList.push(
          <ViewMore
            key={'view-more-replies'}
            onClick={() => {
              this.viewMoreReplies(comment)
            }}
          >
            View {hiddenRepliesCount} more
          </ViewMore>
        )
      }
      _.each(comment.replies, (child, i) => {
        commentsList.push(
          <Comment
            key={`reply-${child.id}` || `reply-new-${i}`}
            comment={child}
            isReply={true}
            viewMoreReplies={() => {
              this.viewMoreReplies(comment)
            }}
          />
        )
      })
      if (uiStore.replyingToCommentId === comment.id) {
        commentsList.push(this.renderCommentEntryForm())
      }
    })
    return commentsList
  }

  renderCommentEntryForm() {
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
