import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Comment from '~/ui/threads/Comment'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'

export const ThumbnailHolder = styled.span`
  display: block;
  flex-shrink: 0;
  height: 50px;
  width: 50px;
  position: relative;
  bottom: 5px;
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
  margin-top: 5px;
`
StyledCommentsWrapper.displayName = 'StyledCommentsWrapper'

@observer
class CommentThread extends React.Component {
  renderComments = () =>
    this.props.thread.comments.map((comment, i) => (
      <Comment key={comment.id || `comment-new-${i}`} comment={comment} />
    ))

  render() {
    const { thread } = this.props

    return (
      <div>
        <CommentThreadHeader thread={thread} sticky />
        {/* TODO: this `0 10px` is because we moved that out of the overall ActivityContainer */}
        <div style={{ padding: '0 10px' }}>
          <StyledCommentsWrapper className="comments">
            {thread.hasMore && <CommentThreadLoader thread={thread} />}
            {this.renderComments()}
          </StyledCommentsWrapper>
          <CommentEntryForm
            thread={thread}
            afterSubmit={this.props.afterSubmit}
            onHeightChange={this.props.onEditorHeightChange}
          />
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

export default CommentThread
