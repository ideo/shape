import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import FlipMove from 'react-flip-move'
import styled from 'styled-components'

import v from '~/utils/variables'
import Moment from '~/ui/global/Moment'
import Comment from './Comment'

const StyledCommentThread = styled.div`
  .title {
    /* NOTE: just for prototyping, not fully browser supported */
    ${props => props.expanded && `
      position: sticky;
      top: 0;
      z-index: 50;
    `}
    /* ---- */
    width: 100%;
    background: #eee;
    padding: 10px;
    font-family: ${v.fonts.sans};
    font-size: 0.75rem;
    .name {
      font-size: 1.25rem;
      text-transform: uppercase;
    }
  }
  .textarea {
    /* NOTE: just for prototyping, not fully browser supported */
    ${props => props.expanded && `
      position: sticky;
      bottom: -25px;
    `}
    /* ---- */
    width: 100%;
    height: 70px;
    background: gray;
    textarea {
      margin: 5px 5px 0 25px;
      padding: 10px;
      width: 80%;
    }
  }
`

class CommentThread extends React.Component {
  get comments() {
    const { expanded } = this.props
    let { comments } = this.props.thread
    comments = _.sortBy(comments, ['created_at'])
    // for un-expanded thread, only take the last two
    if (!expanded) comments = comments.slice(-2)
    return comments
  }

  renderComments = () => (
    this.comments.map(comment => (
      <FlipMove key={comment.id} appearAnimation="accordionVertical">
        <Comment comment={comment} />
      </FlipMove>
    ))
  )

  render() {
    const { thread, expanded } = this.props

    return (
      <StyledCommentThread expanded={expanded}>
        <button className="title" onClick={this.props.onClick}>
          <span className="name">{ thread.record.name }</span>
          &nbsp; - &nbsp;
          <Moment date={thread.updated_at} format="LT" />
          &nbsp; - &nbsp;
          { thread.comments.length } comments
        </button>
        { this.renderComments() }
        {
          expanded && (
            <div className="textarea">
              <textarea placeholder="add comment" />
            </div>
          )
        }
      </StyledCommentThread>
    )
  }
}

CommentThread.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThread
