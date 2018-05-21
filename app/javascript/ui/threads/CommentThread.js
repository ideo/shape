import PropTypes from 'prop-types'
import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'
import TextareaAutosize from 'react-autosize-textarea'

import CollectionIcon from '~/ui/icons/CollectionIcon'
import TextIcon from '~/ui/icons/TextIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import moment from 'moment-mini'
import Moment from '~/ui/global/Moment'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
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
    padding: 20px 10px 0 10px;
    text-align: left;
    font-family: ${v.fonts.sans};
    font-weight: 500;
    font-size: 0.75rem;
    .name {
      font-size: 1.25rem;
      text-transform: uppercase;
    }
  }
  .comments {
    margin: 0 10px 0 60px;
    ${props => !props.expanded && `
      z-index: 0;
      position: relative;
      top: -40px;
      overflow: hidden;
      margin-bottom: -40px;
    `}
  }
  form.reply {
    position: relative;
    /* NOTE: just for prototyping, not fully browser supported */
    ${props => props.expanded && `
      position: sticky;
      bottom: 0;
    `}
    ${props => !props.expanded && `
      display: none;
    `}
    /* ---- */
    width: calc(100% - 20px);
    margin-left: 20px;
    min-height: 70px;
    background: ${v.colors.activityDarkBlue};
    background: linear-gradient(
      ${hexToRgba(v.colors.activityDarkBlue, 0)} 0,
      ${v.colors.activityDarkBlue} 10%,
      ${v.colors.activityDarkBlue} 100%
    );
    padding-top: 10px;
    margin-top: -5px;
    .textarea-input {
      background: ${v.colors.activityMedBlue};
      margin: 0 5px 0 40px;
      width: calc(100% - 50px);
    }
    textarea {
      width: calc(100% - 40px);
      resize: none;
      color: white;
      padding: 10px;
      border: none;
      background: none;
      font-size: 1rem;
      font-family: ${v.fonts.sans};
      :focus {
        border: none;
        outline: none;
      }
      ::placeholder {
        color: ${v.colors.gray};
      }
      /* TODO: cross-browser friendly way to hide scrollbar?
        note this is only for a really long comment (>6 rows) */
      ::-webkit-scrollbar {
        background: none;
      }
    }
    /* submit */
    button {
      position: absolute;
      right: 18px;
      top: 20px;
      width: 18px;
      height: 18px;

    }
  }
`

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  height: 50px;

  *:first-child {
    margin-right: 8px;
  }

  *:last-child {
    margin-left: auto;
  }
`

const ThumbnailHolder = styled.span`
  width: 50px;
  img, svg {
    width: 100%;
  }
`

@observer
class CommentThread extends React.Component {
  @observable message = ''

  componentDidMount() {
    this.focusTextArea(this.props.expanded)
  }

  componentWillReceiveProps({ expanded }) {
    this.focusTextArea(expanded)
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
    comments = _.sortBy(comments, ['created_at'])
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
        content = <TextIcon viewBox="0 0 50 50 " />
      } else {
        content = <img src={record.filestack_file_url} alt="Text" />
      }
    } else {
      if (record.cover.image_url) {
        content = <img src={record.cover.image_url} alt="Collection" />
      } else {
        content = <CollectionIcon viewBox="50 50 150 150" />
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
          <StyledHeader>
            {this.renderThumbnail()}
            <span className="name">{ thread.record.name }</span>
            <Moment
              date={thread.updated_at}
            />
          </StyledHeader>
        </button>
        <div className="comments">
          { this.renderComments() }
        </div>
        <form className="reply" onSubmit={this.handleSubmit}>
          <div className="textarea-input">
            <TextareaAutosize
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
        </form>
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
