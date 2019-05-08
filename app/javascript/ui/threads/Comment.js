import _ from 'lodash'
import { toJS, observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import createMentionPlugin from 'draft-js-mention-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'
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
import { CommentForm } from '~/ui/global/styled/forms'
import CommentInput from './CommentInput'

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

@observer
class Comment extends React.Component {
  @observable
  commentData = {
    message: '',
    draftjs_data: {},
  }
  @observable
  suggestionsOpen = false
  @observable
  updating = false
  editorHeight = null

  constructor(props) {
    super(props)
    this.mentionPlugin = createMentionPlugin()
    this.linkifyPlugin = createLinkifyPlugin({ target: '_blank' })
    this.state = {
      editorState: EditorState.createEmpty(),
      editing: false,
    }
  }

  componentWillMount() {
    const { comment } = this.props
    const draftjsData = toJS(comment.draftjs_data)
    if (!_.isEmpty(draftjsData)) {
      const contentState = convertFromRaw(draftjsData)
      const editorState = EditorState.createWithContent(contentState)
      this.setState({ editorState })
    }
  }

  componentWillUnmount() {
    this.editor = null
  }

  renderMessage() {
    const { comment } = this.props
    // TODO Editor for non-draft-js comments
    if (_.isEmpty(toJS(comment.draftjs_data))) {
      // fallback only necessary for supporting older comments before we added draftjs
      // otherwise this use case will go away
      return comment.message
    }
    return (
      <CommentForm onSubmit={this.handleSubmit}>
        <div className="textarea-input">
          <CommentInput
            editorState={this.state.editorState}
            onChange={this.handleInputChange}
            onOpenSuggestions={this.handleOpenSuggestions}
            onCloseSuggestions={this.handleCloseSuggestions}
            handleReturn={this.handleReturn}
            setEditor={this.setEditor}
            readOnly={!this.state.editing}
          />
        </div>
        {this.state.editing && (
          <button>
            <ReturnArrowIcon />
          </button>
        )}
      </CommentForm>
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

  @action
  handleInputChange = editorState => {
    if (this.updating) return
    const content = editorState.getCurrentContent()
    const message = content.getPlainText()
    this.commentData.message = message
    this.commentData.draftjs_data = convertToRaw(content)
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

  @action
  handleOpenSuggestions = () => {
    this.suggestionsOpen = true
  }

  @action
  handleCloseSuggestions = () => {
    this.suggestionsOpen = false
  }

  handleReturn = e => {
    if (!e.shiftKey && !this.suggestionsOpen) {
      // submit message
      this.handleSubmit(e)
      return 'handled'
    }
    return 'not-handled'
  }

  handleSubmit = e => {
    e.preventDefault()
    console.log('handle submit')
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
            <Timestamp className="timestamp hide-on-hover">
              <Moment date={comment.updated_at} />
            </Timestamp>
            <StyledCommentActions className="show-on-hover">
              {comment.persisted &&
                apiStore.currentUserId === comment.author.id && (
                  <React.Fragment>
                    <ActionButton
                      onClick={this.handleEditClick}
                      className="test-edit-comment"
                    >
                      <EditPencilIcon />
                    </ActionButton>
                    <ActionButton
                      onClick={this.handleDeleteClick}
                      className="test-delete-comment"
                    >
                      <TrashLgIcon />
                    </ActionButton>
                  </React.Fragment>
                )}
            </StyledCommentActions>
          </FlexPushRight>
        </InlineRow>

        <div className="message">{this.renderMessage()}</div>
      </StyledComment>
    )
  }
}

Comment.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Comment
