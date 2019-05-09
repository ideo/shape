import { isEmpty } from 'lodash'
import { toJS, runInAction } from 'mobx'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import styled from 'styled-components'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import { InlineRow } from '~/ui/global/styled/layout'
import Moment from '~/ui/global/Moment'
import Avatar from '~/ui/global/Avatar'
import { StyledCommentInput } from './CustomCommentMentions'
import { apiStore, uiStore } from '~/stores'
import TrashLgIcon from '~/ui/icons/TrashLgIcon'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import { showOnHoverCss, hideOnHoverCss } from '~/ui/grid/shared'
import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import CommentInput from './CommentInput'
import XIcon from '~/ui/icons/XIcon'
import Tooltip from '~/ui/global/Tooltip'

const StyledComment = StyledCommentInput.extend`
  ${showOnHoverCss};
  ${hideOnHoverCss};
  padding: 10px;
  margin-bottom: 5px;
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
      color: ${v.colors.ctaPrimary};
    }
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
`

const EnterButton = styled.button`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 30px;
  height: 30px;
  background-color: ${v.colors.secondaryDark};
  border-radius: 50%;
  padding: 6px;

  svg {
    transform: scale(1, -1);
  }

  &:hover {
    filter: brightness(90%);
  }
`

const CancelEditButton = styled.button`
  width: 22px;
  height: 22px;
`

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

  componentWillMount() {
    const { comment } = this.props
    const draftjsData = toJS(comment.draftjs_data)
    const contentState = convertFromRaw(draftjsData)
    const editorState = EditorState.createWithContent(contentState)
    this.setState({ editorState })

    document.addEventListener('keydown', this.handleEscape, false)
  }

  componentWillUnmount() {
    this.editor = null
    document.removeEventListener('keydown', this.handleEscape, false)
  }

  isDraftJSComment() {
    return !isEmpty(toJS(this.props.comment.draftjs_data))
  }

  renderMessage() {
    return (
      <StyledForm onSubmit={this.handleSubmit}>
        <CommentInput
          editorState={this.state.editorState}
          onChange={this.handleInputChange}
          handleSubmit={this.handleSubmit}
          setEditor={this.setEditor}
          readOnly={!this.state.editing}
        />
        {this.state.editing && (
          <EnterButton className="test-update-comment">
            <ReturnArrowIcon />
          </EnterButton>
        )}
      </StyledForm>
    )
  }

  handleEditClick = () => {
    this.setState({ editing: true })
    this.focusTextArea()
  }

  handleDeleteClick = () => {
    const { comment } = this.props
    uiStore.confirm({
      iconName: 'Alert',
      prompt:
        'Are you sure you want to delete this comment? You will not be able to undo this action',
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
    this.setState({ editing: false })
  }

  render() {
    const { comment } = this.props
    const { author } = comment

    return (
      <StyledComment unread={comment.unread}>
        <InlineRow align="center">
          <Avatar
            title={author.name}
            url={author.pic_url_square}
            linkToCollectionId={author.user_profile_collection_id}
            className="author-img"
          />
          <DisplayText className="author" color={v.colors.white}>
            {comment.author.name}
          </DisplayText>
          <FlexPushRight>
            {!this.state.editing && (
              <React.Fragment>
                <Timestamp className="timestamp hide-on-hover">
                  <Moment date={comment.created_at} />
                </Timestamp>
                <StyledCommentActions className="show-on-hover">
                  {comment.persisted &&
                    apiStore.currentUserId === comment.author.id && (
                      <React.Fragment>
                        <Tooltip placement="top" title="edit comment">
                          <ActionButton
                            onClick={this.handleEditClick}
                            className="test-edit-comment"
                          >
                            <EditPencilIcon />
                          </ActionButton>
                        </Tooltip>
                        <Tooltip placement="top" title="delete comment">
                          <ActionButton
                            onClick={this.handleDeleteClick}
                            className="test-delete-comment"
                          >
                            <TrashLgIcon />
                          </ActionButton>
                        </Tooltip>
                      </React.Fragment>
                    )}
                </StyledCommentActions>
              </React.Fragment>
            )}
            {this.state.editing && (
              <StyledCommentActions>
                <CancelEditButton
                  onClick={this.handleCancelEditClick}
                  className="test-cancel-edit-comment"
                >
                  <XIcon />
                </CancelEditButton>
              </StyledCommentActions>
            )}
          </FlexPushRight>
        </InlineRow>

        <div className="message">
          {this.renderMessage()}
          {comment.updated_at > comment.created_at && (
            <span className="test-edited-indicator">(edited)</span>
          )}
        </div>
      </StyledComment>
    )
  }
}

Comment.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Comment
