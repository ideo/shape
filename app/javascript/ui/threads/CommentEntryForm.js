import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertToRaw } from 'draft-js'
import { get } from 'lodash'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { CommentForm, CommentEnterButton } from '~/ui/global/styled/forms'
import CommentInput from '~/ui/threads/CommentInput'
import styled from 'styled-components'
import v from '~/utils/variables.js'

const StyledCommentInputWrapper = styled.div`
  background: ${v.colors.secondaryMedium};
  font-family: ${v.fonts.sans};
  padding: 10px;
  ${props =>
    props.replying &&
    `
      border-left: 8px solid ${v.colors.secondaryDarkest};
      margin-top: -2px;
    `};
`
StyledCommentInputWrapper.displayName = 'StyledCommentInputWrapper'

@inject('uiStore')
@observer
class CommentEntryForm extends React.Component {
  editorHeight = null
  state = {
    editorState: EditorState.createEmpty(),
    updating: false,
    focused: false,
  }

  componentDidMount() {
    this.focusTextArea()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.commentingOnRecord && this.props.commentingOnRecord) {
      // if a new commentingOnRecord was just set
      this.focusTextArea()
    }
  }

  componentWillUnmount() {
    this.editor = null
  }

  focusTextArea = () => {
    // NOTE: draft-js-plugins need timeout, even with 0 delay, see:
    // https://github.com/draft-js-plugins/draft-js-plugins/issues/800#issuecomment-315950836
    setTimeout(() => {
      if (!this.editor) return
      this.editor.focus()
    })
  }

  handleInputChange = editorState => {
    const { uiStore } = this.props
    const { replyingToCommentId } = uiStore
    if (this.state.updating) return
    const editorSelection = editorState.getSelection()
    const focused = editorSelection.getHasFocus()
    const appendingToInput = editorSelection.getFocusOffset() > 0
    this.setState(
      {
        editorState,
        focused,
      },
      () => {
        this.handleHeightChange()
      }
    )
    if (appendingToInput && replyingToCommentId) {
      uiStore.scrollToBottomOfComments(replyingToCommentId)
    }
  }

  handleHeightChange = () => {
    const newEditorHeight = get(
      this.editor,
      'editor.editorContainer.scrollHeight'
    )

    if (!newEditorHeight) return

    // only call if this.editorHeight was going from an existing value to some new value
    if (this.editorHeight && this.editorHeight !== newEditorHeight) {
      this.props.onHeightChange()
    }

    this.editorHeight = newEditorHeight
  }

  setEditor = (editor, { unset = false } = {}) => {
    if (unset) {
      this.editor = null
      return
    }
    if (this.editor) return
    this.editor = editor
    this.focusTextArea()
  }

  handleSubmit = e => {
    const { uiStore } = this.props
    const { replyingToCommentId } = uiStore
    const content = this.state.editorState.getCurrentContent()
    const message = content.getPlainText()

    e.preventDefault()
    // don't allow submit of empty comment
    if (!message) return

    const rawData = {
      message,
      draftjs_data: convertToRaw(content),
      parent_id: replyingToCommentId,
    }

    const { thread } = this.props
    this.setState(
      {
        updating: true,
        editorState: EditorState.createEmpty(),
      },
      async () => {
        await thread.API_saveComment(rawData)
        this.props.afterSubmit()
        this.setState({ updating: false }, () => {
          this.focusTextArea()
        })
      }
    )
  }

  handleBlur = e => {
    const { relatedTarget } = e
    if (
      relatedTarget &&
      relatedTarget.getAttribute('data-attr-comment-button')
    ) {
      return
    }

    const { uiStore } = this.props
    uiStore.setCommentingOnRecord(null)
  }

  get renderSubjectOfComment() {
    const { uiStore } = this.props
    const { textContent } = uiStore.selectedTextRangeForCard
    if (!uiStore.commentingOnRecord) return

    if (textContent) {
      return <div>{textContent}</div>
    } else {
      // information about the item/collection
    }
  }

  render() {
    const { editorState, updating } = this.state
    const { uiStore } = this.props

    return (
      <CommentForm onSubmit={this.handleSubmit}>
        <StyledCommentInputWrapper replying={!!uiStore.replyingToCommentId}>
          {this.renderSubjectOfComment}
          <CommentInput
            disabled={updating}
            editorState={editorState}
            onChange={this.handleInputChange}
            handleSubmit={this.handleSubmit}
            setEditor={this.setEditor}
            onBlur={this.handleBlur}
          />
        </StyledCommentInputWrapper>
        <CommentEnterButton
          data-attr-comment-button
          focused={this.state.focused}
        >
          <ReturnArrowIcon />
        </CommentEnterButton>
      </CommentForm>
    )
  }
}

CommentEntryForm.defaultProps = {
  replying: false,
}

CommentEntryForm.propTypes = {
  afterSubmit: PropTypes.func.isRequired,
  onHeightChange: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
  commentingOnRecord: MobxPropTypes.objectOrObservableObject,
  replying: PropTypes.bool,
}

CommentEntryForm.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CommentEntryForm.defaultProps = {
  commentingOnRecord: null,
}

CommentEntryForm.displayName = 'CommentEntryForm'

export default CommentEntryForm
