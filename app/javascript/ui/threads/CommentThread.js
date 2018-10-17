import PropTypes from 'prop-types'
import { EditorState } from 'draft-js'
import { observable, action, computed } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'

import { routingStore } from '~/stores'
import Link from '~/ui/global/Link'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import CommentIconFilled from '~/ui/icons/CommentIconFilled'
import TextIcon from '~/ui/icons/TextIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import Moment from '~/ui/global/Moment'
import Comment from './Comment'
import CommentEntryForm from './CommentEntryForm'
import CommentThreadLoader from './CommentThreadLoader'

const StyledCommentThread = styled.div`
  .title {
    position: relative;
    top: 0;
    z-index: ${v.zIndex.commentHeader};
    /* NOTE: 'sticky' is not fully browser supported */
    ${props =>
      props.expanded &&
      `
      position: sticky;
    `} /* ---- */
    display: block;
    width: 100%;
    background-color: ${v.colors.secondaryDark};
    background: linear-gradient(
      ${v.colors.secondaryDark} 0,
      ${v.colors.secondaryDark} 80%,
      ${hexToRgba(v.colors.secondaryDark, 0)} 100%
    );
    padding: 10px 10px 0 10px;
    text-align: left;
    font-family: ${v.fonts.sans};
    font-weight: 500;
    font-size: 0.75rem;
  }
  .comments {
    margin: 5px 10px 0 10px;
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

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  height: ${props => (props.lines === 1 ? 50 : 70)}px;

  *:first-child {
    margin-right: 8px;
  }

  .timestamp {
    margin-left: auto;
  }

  .name {
    font-size: 1.25rem;
    line-height: 1.5rem;
    text-transform: uppercase;
  }
  .unread {
    color: ${v.colors.alert};
    display: flex;
    flex-basis: content;
    height: 12px;
    width: 25px;
    margin-left: 10px;
    svg {
      margin-left: 4px;
      height: 100%;
      width: 100%;
    }
    .inner {
      display: flex;
      opacity: 0;
      transition: opacity 1s 2s ease;
    }
    &.show-unread .inner {
      opacity: 1;
    }
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
  @observable
  titleLines = 1

  componentDidMount() {
    this.countLines()
  }

  @action
  countLines = () => {
    if (this.title && this.title.offsetHeight > 24) {
      this.titleLines = 2
    }
  }

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

  objectLink() {
    const { thread } = this.props
    const { record } = thread

    if (record.internalType === 'collections') {
      return routingStore.pathTo('collections', record.id)
    } else if (record.internalType === 'items') {
      return routingStore.pathTo('items', record.id)
    }
    return routingStore.pathTo('homepage')
  }

  renderThumbnail() {
    const { thread } = this.props
    const { record } = thread
    let content
    if (record.internalType === 'items') {
      if (record.type === ITEM_TYPES.TEXT) {
        content = <TextIcon viewBox="0 0 70 70" />
      } else {
        content = <img src={record.filestack_file_url} alt="Text" />
      }
    } else {
      content = <CollectionIcon viewBox="50 50 170 170" />
      if (record.cover.image_url) {
        content = <img src={record.cover.image_url} alt={record.name} />
      }
    }
    return (
      <Link to={this.objectLink()}>
        <ThumbnailHolder>{content}</ThumbnailHolder>
      </Link>
    )
  }

  renderUnreadCount = () => {
    const { thread } = this.props
    return (
      <span className={`unread ${thread.unreadCount && 'show-unread'}`}>
        <span className="inner">
          {thread.unreadCount}
          <CommentIconFilled />
        </span>
      </span>
    )
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
          <StyledHeader lines={this.titleLines}>
            {this.renderThumbnail()}
            <Dotdotdot clamp={2}>
              <span
                className="name"
                ref={r => {
                  this.title = r
                }}
              >
                {thread.record.name}
              </span>
            </Dotdotdot>
            <span className="timestamp">
              <Moment date={thread.updated_at} />
            </span>
            {this.renderUnreadCount()}
          </StyledHeader>
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
