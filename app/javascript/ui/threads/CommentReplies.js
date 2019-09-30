import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Comment from '~/ui/threads/Comment'

const ViewMore = styled.div`
  cursor: pointer;
  font-size: 12px;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  background: ${v.colors.secondaryMedium};
  color: ${v.colors.commonDark};
  padding: 4px 0px 4px 10px;
  border-bottom: 1px solid ${v.colors.secondaryDark};
`
ViewMore.displayName = 'ViewMore'

const StyledCommentReplies = styled.div`
  border-left: 8px solid ${v.colors.secondaryDarkest};
  margin-top: -4px;
  margin-bottom: 4px;
`
StyledCommentReplies.displayName = 'StyledCommentReplies'

@observer
class CommentReplies extends React.Component {
  expandReplies = () => {
    this.props.comment.API_fetchReplies()
  }

  get replies() {
    const { comment, expanded } = this.props
    if (expanded) {
      return comment.replies
    } else {
      return comment.replies.slice(-3)
    }
  }

  render() {
    const { comment, expanded } = this.props
    const { replies } = this
    const commentsList = []
    // total replies count minus observable replies length
    const repliesLength = expanded
      ? comment.replies.length
      : this.replies.length
    const hiddenRepliesCount = comment.replies_count - repliesLength
    if (hiddenRepliesCount > 0) {
      commentsList.push(
        <ViewMore key={'view-more-replies'} onClick={this.expandReplies}>
          View {hiddenRepliesCount} more
        </ViewMore>
      )
    }
    _.each(replies, (child, i) => {
      commentsList.push(
        <Comment
          key={`reply-${child.id}` || `reply-new-${i}`}
          comment={child}
          isReply={true}
        />
      )
    })
    return <StyledCommentReplies>{commentsList}</StyledCommentReplies>
  }
}

CommentReplies.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
  expanded: PropTypes.bool.isRequired,
}

export default CommentReplies
