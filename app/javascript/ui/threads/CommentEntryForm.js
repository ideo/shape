import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertToRaw } from 'draft-js'
import { get } from 'lodash'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { CommentForm, CommentEnterButton } from '~/ui/global/styled/forms'
import CommentInput from '~/ui/threads/CommentInput'
import styled from 'styled-components'
import v from '~/utils/variables.js'
import CommentSubject from '~/ui/threads/CommentSubject'

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
        editorState: EditorState.createEmpty(),
      },
      () => {
        thread.API_saveComment(rawData)
        // NOTE: the next steps do not need to await the API save to finish,
        // your temp comment will get added to apiStore and you can continue typing your next comment.
        // also, awaiting led to some clunky issues with the comment cursor.
        this.props.afterSubmit()
        this.focusTextArea()
      }
    )
  }

  get renderSubjectOfComment() {
    const { uiStore, thread } = this.props
    const { textContent } = uiStore.selectedTextRangeForCard

    if (!uiStore.commentingOnRecord) return null

    if (textContent) {
      return (
        <CommentSubject
          subjectRecord={uiStore.commentingOnRecord}
          textContent={textContent}
          threadRecord={thread.record}
        />
      )
    } else {
      return (
        <CommentSubject
          subjectRecord={uiStore.commentingOnRecord}
          threadRecord={thread.record}
        />
      )
    }
  }

  render() {
    const { editorState } = this.state
    const { uiStore } = this.props

    return (
      <CommentForm onSubmit={this.handleSubmit}>
        <StyledCommentInputWrapper replying={!!uiStore.replyingToCommentId}>
          {this.renderSubjectOfComment}
          <CommentInput
            editorState={editorState}
            onChange={this.handleInputChange}
            handleSubmit={this.handleSubmit}
            setEditor={this.setEditor}
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
