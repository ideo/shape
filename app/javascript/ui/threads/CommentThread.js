import PropTypes from 'prop-types'
import { EditorState } from 'draft-js'
import { observable, computed } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { css } from 'styled-components'

import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import Comment from './Comment'
import CommentEntryForm from './CommentEntryForm'
import CommentThreadLoader from './CommentThreadLoader'
import CommentThreadHeader from './CommentThreadHeader'

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

@observer
class CommentThread extends React.Component {
  @observable
  commentData = {
    message: '',
    draftjs_data: {},
  }
  @observable
  editorState = EditorState.createEmpty()

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

  renderComments = () =>
    this.comments.map((comment, i) => (
      <Comment key={comment.id || `comment-new-${i}`} comment={comment} />
    ))

  render() {
    const { thread, expanded } = this.props
    const unexpandedClickable = !expanded && thread.unreadCount > 0

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
          {thread.hasMore &&
            expanded && <CommentThreadLoader thread={thread} />}
          {this.renderComments()}
        </StyledCommentsWrapper>
        <CommentEntryForm
          expanded={expanded}
          thread={thread}
          afterSubmit={this.props.afterSubmit}
        />
      </StyledCommentThread>
    )
  }
}

CommentThread.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  afterSubmit: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThread
