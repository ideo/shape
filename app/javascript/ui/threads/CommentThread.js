import PropTypes from 'prop-types'
import { computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { css } from 'styled-components'

import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import Comment from '~/ui/threads/Comment'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import _ from 'lodash'

export const threadTitleCss = css`
  position: relative;
  top: 0;
  z-index: ${v.zIndex.commentHeader};
  display: block;
  width: 100%;
  background-color: ${v.colors.secondaryDark};
  background: linear-gradient(
    ${v.colors.secondaryDark} 0,
    ${v.colors.secondaryDark} 80%,
    ${hexToRgba(v.colors.secondaryDark, 0)} 100%
  );
  padding-top: 10px;
  text-align: left;
  font-family: ${v.fonts.sans};
  font-weight: 500;
  font-size: 0.75rem;
`

const StyledCommentThread = styled.div`
  .title {
    ${threadTitleCss};
    /* NOTE: 'sticky' is not fully browser supported */
    ${props =>
      props.expanded &&
      `
      position: sticky;
    `};
  }
  .comments {
    margin-top: 5px;
    ${props =>
      (!props.expanded || props.hasMore) &&
      `
      z-index: 0;
      position: relative;
      top: -40px;
      overflow: hidden;
      margin-bottom: -40px;
      min-height: 40px;
    `};
  }
`

export const ThumbnailHolder = styled.span`
  display: block;
  flex-shrink: 0;
  height: 50px;
  width: 50px;
  img,
  svg {
    flex-shrink: 0;
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`
ThumbnailHolder.displayName = 'ThumbnailHolder'

const StyledCommentsWrapper = styled.div`
  cursor: ${props => (props.clickable ? 'pointer' : 'auto')};
`
StyledCommentsWrapper.displayName = 'StyledCommentsWrapper'

@inject('uiStore')
@observer
class CommentThread extends React.Component {
  @computed
  get comments() {
    const { expanded, thread } = this.props
    let { comments } = thread
    // for un-expanded thread, only take the unread comments
    if (!expanded) {
      comments = thread.latestUnreadComments
    }
    return comments
  }

  renderComments = () => {
    const { uiStore } = this.props
    if (!this.comments || this.comments.length <= 0) return []
    const commentsList = []
    _.each(this.comments, (comment, i) => {
      commentsList.push(
        <Comment key={comment.id || `comment-new-${i}`} comment={comment} />
      )
      _.each(comment.replies, (child, i) => {
        commentsList.push(
          <Comment
            key={child.id || `comment-reply-new-${i}`}
            comment={child}
            isReply={true}
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
    const { thread, expanded } = this.props
    return (
      <CommentEntryForm
        expanded={expanded}
        thread={thread}
        afterSubmit={this.props.afterSubmit}
        onHeightChange={this.props.onEditorHeightChange}
      />
    )
  }

  render() {
    const { thread, expanded, uiStore } = this.props
    const unexpandedClickable = !expanded

    return (
      <StyledCommentThread hasMore={thread.hasMore} expanded={expanded}>
        <button className="title" onClick={this.props.onClick}>
          <CommentThreadHeader thread={thread} />
        </button>
        <StyledCommentsWrapper
          clickable={unexpandedClickable}
          className="comments"
          onClick={unexpandedClickable ? this.props.onClick : () => true}
        >
          {thread.hasMore && expanded && (
            <CommentThreadLoader thread={thread} />
          )}
          {this.renderComments()}
        </StyledCommentsWrapper>
        {!uiStore.replyingToCommentId && this.renderCommentEntryForm()}
      </StyledCommentThread>
    )
  }
}

CommentThread.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  afterSubmit: PropTypes.func.isRequired,
  onEditorHeightChange: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentThread.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThread
