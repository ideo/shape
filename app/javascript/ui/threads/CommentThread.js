import PropTypes from 'prop-types'
import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'

import CollectionIcon from '~/ui/icons/CollectionIcon'
import TextIcon from '~/ui/icons/TextIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import Moment from '~/ui/global/Moment'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { CommentForm, CommentTextarea } from '~/ui/global/styled/forms'
import Comment from './Comment'

const StyledCommentThread = styled.div`
  .title {
    position: relative;
    top: 0;
    z-index: 50;
    /* NOTE: just for prototyping, not fully browser supported */
    ${props => props.expanded && `
      position: sticky;
    `}
    /* ---- */
    display: block;
    width: 100%;
    background-color: ${v.colors.activityDarkBlue};
    background: linear-gradient(
      ${v.colors.activityDarkBlue} 0,
      ${v.colors.activityDarkBlue} 80%,
      ${hexToRgba(v.colors.activityDarkBlue, 0)} 100%
    );
    padding: 10px 10px 0 10px;
    text-align: left;
    font-family: ${v.fonts.sans};
    font-weight: 500;
    font-size: 0.75rem;
    .name {
      font-size: 1.25rem;
      line-height: 1.5rem;
      text-transform: uppercase;
    }
  }
  .comments {
    margin: 0 10px 0 68px;
    ${props => !props.expanded && `
      z-index: 0;
      position: relative;
      top: -40px;
      overflow: hidden;
      margin-bottom: -40px;
      min-height: 40px;
    `}
  }
  form.reply {
    /* NOTE: just for prototyping, not fully browser supported */
    ${props => props.expanded && `
      position: sticky;
      bottom: 0;
    `}
    ${props => !props.expanded && `
      display: none;
    `}
    /* ---- */
    width: calc(100% - 10px);
    border-top: 4px solid ${v.colors.activityDarkBlue};
    background: ${v.colors.activityDarkBlue};
    background: linear-gradient(
      ${hexToRgba(v.colors.activityDarkBlue, 0)} 0,
      ${v.colors.activityDarkBlue} 10%,
      ${v.colors.activityDarkBlue} 100%
    );
    .textarea-input {
      background: ${v.colors.activityMedBlue};
      margin: 0 5px 0 68px;
      width: calc(100% - 68px);
    }
    textarea {
      width: calc(100% - 40px);
      color: white;
    }
  }
`

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  height: ${props => (props.lines === 1 ? 50 : 70)}px;

  *:first-child {
    margin-right: 8px;
  }

  *:last-child {
    margin-left: auto;
  }
`

const ThumbnailHolder = styled.span`
  display: block;
  flex-shrink: 0;
  height: 50px;
  width: 50px;
  img, svg {
    flex-shrink: 0;
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`

@observer
class CommentThread extends React.Component {
  @observable message = ''
  @observable titleLines = 1

  componentDidMount() {
    this.focusTextArea(this.props.expanded)
    this.countLines()
  }

  componentWillReceiveProps({ expanded }) {
    this.focusTextArea(expanded)
  }

  @action countLines = () => {
    if (this.title && this.title.offsetHeight > 24) {
      this.titleLines = 2
    }
  }

  focusTextArea = (expanded) => {
    if (expanded && this.textarea) {
      // NOTE: for some reason needs to delay before focus? because of animated scroll?
      setTimeout(() => {
        if (this.textarea) this.textarea.focus()
      }, 50)
    }
  }

  get comments() {
    const { expanded } = this.props
    let { comments } = this.props.thread
    comments = _.sortBy(comments, ['updated_at'])
    // for un-expanded thread, only take the last two
    if (!expanded) comments = comments.slice(-2)
    return comments
  }

  @action handleTextChange = (ev) => {
    this.message = ev.target.value
  }

  handleSubmit = async (e) => {
    e.preventDefault()
    const { thread } = this.props
    await thread.API_saveComment(this.message)
    runInAction(() => {
      this.message = ''
    })
    this.props.afterSubmit()
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
      // eslint-disable-next-line
      if (record.cover.image_url) {
        content = <img src={record.cover.image_url} alt="Collection" />
      } else {
        content = <CollectionIcon viewBox="50 50 170 170" />
      }
    }
    return <ThumbnailHolder>{content}</ThumbnailHolder>
  }

  renderComments = () => (
    this.comments.map(comment => (
      <Comment key={comment.id} comment={comment} />
    ))
  )

  render() {
    const { thread, expanded } = this.props

    return (
      <StyledCommentThread expanded={expanded}>
        <button className="title" onClick={this.props.onClick}>
          <StyledHeader lines={this.titleLines}>
            {this.renderThumbnail()}
            <Dotdotdot clamp={2}>
              <span className="name" ref={(r) => { this.title = r }}>
                { thread.record.name }
              </span>
            </Dotdotdot>
            <Moment
              date={thread.updated_at}
            />
          </StyledHeader>
        </button>
        <div className="comments">
          { this.renderComments() }
        </div>
        <CommentForm className="reply" onSubmit={this.handleSubmit}>
          <div className="textarea-input">
            <CommentTextarea
              placeholder="add comment"
              value={this.message}
              onChange={this.handleTextChange}
              innerRef={(input) => { this.textarea = input }}
              maxRows={6}
            />
          </div>
          <button>
            <ReturnArrowIcon />
          </button>
        </CommentForm>
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
