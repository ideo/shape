import { isEmpty } from 'lodash'
import { toJS, runInAction } from 'mobx'
import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import styled from 'styled-components'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import { InlineRow } from '~/ui/global/styled/layout'
import { CommentEnterButton } from '~/ui/global/styled/forms'
import Moment from '~/ui/global/Moment'
import Avatar from '~/ui/global/Avatar'
import { StyledCommentInput } from './CustomCommentMentions'
// NOTE: this is the only usage of TrashIconLg -- TrashXl looks a tiny bit off if used here
import TrashIconLg from '~/ui/icons/TrashIconLg'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import CalloutBoxIcon from '~/ui/icons/CalloutBoxIcon'
import { showOnHoverCss, hideOnHoverCss } from '~/ui/grid/shared'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import XIcon from '~/ui/icons/XIcon'
import Tooltip from '~/ui/global/Tooltip'
import CommentInput from './CommentInput'
import * as linkify from 'linkifyjs'
import Linkify from 'linkifyjs/react'
import mention from 'linkifyjs/plugins/mention'
import { scroller } from 'react-scroll'

mention(linkify)

const StyledComment = styled(StyledCommentInput)`
  ${showOnHoverCss};
  ${hideOnHoverCss};
  padding: 10px;
  ${props =>
    props.isReply &&
    `
    border-bottom: 1px solid ${v.colors.secondaryDark};
  `}
  ${props =>
    !props.isReply &&
    `
    border-bottom: 5px solid ${v.colors.secondaryDark};
  `}
  background: ${props =>
    props.unread ? v.colors.secondaryLight : v.colors.secondaryMedium};
  transition: background 1s 0.5s ease;

  &:last-child {
    margin-bottom: 0;
  }

  .message {
    font-family: ${v.fonts.sans};
    margin-top: 5px;
    a,
    a:hover,
    a:active,
    a:visited {
      color: ${v.colors.white};
    }
    word-wrap: break-word;
  }
`

export const StyledCommentActions = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 32px;

  svg {
    color: ${v.colors.commonDark};
    &:hover {
      color: ${v.colors.commonLight};
    }
  }
`

const FlexPushRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  position: relative;
`

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
`

const Timestamp = styled.span`
  position: absolute;
  right: 0;
`

const StyledForm = styled.form`
  position: relative;
  min-height: 50px;
`

const EditEnterButton = styled(CommentEnterButton)`
  position: absolute;
  right: 0;
  bottom: 0;
`

const CancelEditButton = styled.button`
  width: 22px;
  height: 22px;
`
CancelEditButton.displayName = 'CancelEditButton'

const EditedIndicator = styled.span`
  color: ${v.colors.secondaryDarkest};
  font-size: 0.75rem;
  padding-left: 10px;
`
EditedIndicator.displayName = 'EditedIndicator'

@inject('apiStore', 'uiStore')
@observer
class Comment extends React.Component {
  constructor(props) {
    super(props)
    this.handleEscape = this.handleEscape.bind(this)
    this.state = {
      editorState: EditorState.createEmpty(),
      editing: false,
      updating: false,
    }
  }

  componentDidMount() {
    this.initializeEditorState()
    document.addEventListener('keydown', this.handleEscape, false)
  }

  componentDidUpdate(prevProps) {
    if (!this.props.expanded && prevProps.expanded) {
      this.collapseReplies()
    }
  }

  componentWillUnmount() {
    this.editor = null
    document.removeEventListener('keydown', this.handleEscape, false)
  }

  initializeEditorState() {
    const { comment } = this.props
    const draftjsData = toJS(comment.draftjs_data)
    const contentState = convertFromRaw(draftjsData)
    const editorState = EditorState.createWithContent(contentState)
    this.setState({ editorState, editing: false })
  }

  isDraftJSComment() {
    return !isEmpty(toJS(this.props.comment.draftjs_data))
  }

  // will return itself if it is a parent comment
  get parentComment() {
    const { apiStore, comment, isReply } = this.props
    if (isReply) {
      // when clicking a reply, you are replying to the parent
      return apiStore.find('comments', comment.parent_id)
    } else {
      return comment
    }
  }

  expandReplies = () => {
    const { parentComment } = this
    // only fetch more on click if we haven't loaded the first page
    if (parentComment.replyPage) return
    parentComment.API_fetchReplies()
  }

  collapseReplies = () => {
    const { comment } = this.props
    runInAction(() => {
      comment.replies.replace(comment.replies.slice(-3))
      comment.replyPage = null
    })
  }

  handleClick = e => {
    const { isReply, comment, uiStore } = this.props
    const { editing } = this.state
    // filters out other click handlers nested inside the body
    if (
      e.target.closest('.test-reply-comment') ||
      e.target.closest('.test-edit-comment') ||
      e.target.closest('.test-delete-comment') ||
      editing
    ) {
      return
    }
    // we clicked some parent comment outside of our current comment/replies
    if (!isReply && uiStore.replyingToCommentId !== comment.id) {
      uiStore.setReplyingToComment(null)
      if (isEmpty(comment.replies)) {
        return
      }
    }

    this.toggleReply()
  }

  toggleReply = () => {
    const { uiStore } = this.props
    const { replyingToCommentId } = uiStore
    const { id } = this.parentComment
    if (replyingToCommentId === id) {
      this.collapseReplies()
      uiStore.setReplyingToComment(null)
    } else {
      this.expandReplies()
      // used to wait for other replies to collapse
      setTimeout(() => {
        scroller.scrollTo(`${id}-replies-bottom`, {
          ...v.commentScrollOpts,
          offset:
            -1 *
            document.getElementById(v.commentScrollOpts.containerId)
              .clientHeight,
        })
      }, 100)
      uiStore.setReplyingToComment(id)
    }
  }

  handleEditClick = () => {
    const { uiStore, isReply } = this.props
    this.setState({ editing: true })
    if (!isReply) {
      uiStore.setReplyingToComment(null)
    }
    this.focusTextArea()
  }

  handleDeleteClick = () => {
    const { comment, uiStore } = this.props
    uiStore.confirm({
      iconName: 'Alert',
      prompt:
        'Are you sure you want to delete this comment? You will not be able to undo this action.',
      confirmText: 'Delete',
      onConfirm: () => {
        comment.API_destroy()
      },
    })
  }

  handleInputChange = editorState => {
    if (this.state.updating) return
    this.setState({
      editorState,
    })
  }

  setEditor = (editor, { unset = false } = {}) => {
    if (unset) {
      this.editor = null
      return
    }
    if (this.editor) return
    this.editor = editor
  }

  focusTextArea = () => {
    // NOTE: draft-js-plugins need timeout, even with 0 delay, see:
    // https://github.com/draft-js-plugins/draft-js-plugins/issues/800#issuecomment-315950836
    setTimeout(() => {
      if (!this.editor) return
      this.editor.focus()
    })
  }

  handleSubmit = e => {
    e.preventDefault()

    const content = this.state.editorState.getCurrentContent()
    const message = content.getPlainText()
    // don't allow submit of empty comment
    if (!message) return

    const rawData = {
      message,
      draftjs_data: convertToRaw(content),
    }

    const { comment } = this.props
    comment.API_updateWithoutSync(rawData).then(() => {
      this.setState({ editing: false, updating: false })
    })
    runInAction(() => {
      this.setState({ updating: true })
    })
  }

  handleEscape = e => {
    if (e.keyCode === 27 && this.state.editing) {
      this.handleCancelEditClick()
    }
  }

  handleCancelEditClick = () => {
    // cancel any unsaved edits and re-initialize
    this.initializeEditorState()
  }

  formatCommentMessage(message) {
    const options = {
      format: {
        mention: value => <span style={{ fontWeight: 700 }}>{value}</span>,
        url: value => value,
      },
      formatHref: {
        mention: function(href) {
          // We don't add a link to mentions since we don't link to user profiles
          return null
        },
      },
    }

    return (
      <Linkify tagName="p" options={options}>
        {message}
      </Linkify>
    )
  }

  renderMessage() {
    const { comment } = this.props

    return (
      <React.Fragment>
        {!this.state.editing && (
          <div>
            {this.formatCommentMessage(comment.message)}
            {comment.wasEdited && (
              <EditedIndicator>{'(edited)'}</EditedIndicator>
            )}
          </div>
        )}
        {this.state.editing && (
          <StyledForm onSubmit={this.handleSubmit}>
            <CommentInput
              editorState={this.state.editorState}
              onChange={this.handleInputChange}
              handleSubmit={this.handleSubmit}
              setEditor={this.setEditor}
            />
            <EditEnterButton focused>
              <ReturnArrowIcon />
            </EditEnterButton>
          </StyledForm>
        )}
      </React.Fragment>
    )
  }

  render() {
    const { comment, apiStore, isReply } = this.props
    const { author, unread, persisted, created_at } = comment
    // NOTE: not sure if this is a solution for delete returning undefined author
    if (!author) return null
    const isCurrentUserComment = apiStore.currentUserId === author.id
    const hideTimestampOnHover = isCurrentUserComment || !isReply
    return (
      <StyledComment
        unread={unread}
        isReply={isReply}
        onClick={this.handleClick}
      >
        <InlineRow align="center">
          <Avatar
            title={author.name}
            url={author.pic_url_square}
            linkToCollectionId={author.user_profile_collection_id}
            className="author-img"
          />
          <DisplayText className="author" color={v.colors.white}>
            {author.name}
          </DisplayText>
          <FlexPushRight>
            {!this.state.editing && (
              <React.Fragment>
                <Timestamp
                  className={`timestamp ${
                    hideTimestampOnHover ? 'hide-on-hover' : ''
                  }`}
                >
                  <Moment date={created_at} />
                </Timestamp>
                <StyledCommentActions className="show-on-hover">
                  {persisted && (
                    <React.Fragment>
                      {!isReply && (
                        <Tooltip placement="top" title="reply to comment">
                          <ActionButton
                            onClick={this.toggleReply}
                            className="test-reply-comment"
                          >
                            <CalloutBoxIcon />
                          </ActionButton>
                        </Tooltip>
                      )}
                      {isCurrentUserComment && (
                        <React.Fragment>
                          <Tooltip placement="top" title="edit comment">
                            <ActionButton
                              onClick={this.handleEditClick}
                              className="test-edit-comment"
                            >
                              <EditPencilIcon />
                            </ActionButton>
                          </Tooltip>
                          {comment.replies.length < 1 && (
                            <Tooltip placement="top" title="delete comment">
                              <ActionButton
                                onClick={this.handleDeleteClick}
                                className="test-delete-comment"
                              >
                                <TrashIconLg />
                              </ActionButton>
                            </Tooltip>
                          )}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  )}
                </StyledCommentActions>
              </React.Fragment>
            )}
            {this.state.editing && (
              <StyledCommentActions>
                <CancelEditButton onClick={this.handleCancelEditClick}>
                  <XIcon />
                </CancelEditButton>
              </StyledCommentActions>
            )}
          </FlexPushRight>
        </InlineRow>

        <div className="message">{this.renderMessage()}</div>
      </StyledComment>
    )
  }
}

Comment.defaultProps = {
  isReply: false,
  expanded: false,
}

Comment.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
  isReply: PropTypes.bool,
  expanded: PropTypes.bool,
}

Comment.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

Comment.displayName = 'Comment'

export default Comment
