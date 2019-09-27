import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Comment from '~/ui/threads/Comment'
import { Element as ScrollElement } from 'react-scroll'

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
`
StyledCommentReplies.displayName = 'StyledCommentReplies'

@observer
class CommentReplies extends React.Component {
  viewMoreReplies = () => {
    this.props.comment.API_fetchReplies()
  }

  render() {
    const { comment, replying, commentEntryForm } = this.props
    const commentsList = []
    // total replies count minus observable replies length
    const repliesLength =
      comment.replies && comment.replies.length ? comment.replies.length : 0
    const hiddenRepliesCount = comment.replies_count - repliesLength
    if (hiddenRepliesCount > 0) {
      commentsList.push(
        <ViewMore key={'view-more-replies'} onClick={this.viewMoreReplies}>
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
        />
      )
    })

    commentsList.push(<ScrollElement name={`${comment.id}-replies-bottom`} />)

    if (replying) {
      // render the reply level entry form
      commentsList.push(commentEntryForm())
    }

    return <StyledCommentReplies>{commentsList}</StyledCommentReplies>
  }
}

CommentReplies.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
  replying: PropTypes.bool.isRequired,
  commentEntryForm: PropTypes.func.isRequired,
}

export default CommentReplies
