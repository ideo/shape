import PropTypes from 'prop-types'
import { runInAction } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import { get } from 'lodash'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { CommentForm, CommentEnterButton } from '~/ui/global/styled/forms'
import CommentInput from '~/ui/threads/CommentInput'
import styled from 'styled-components'
import v from '~/utils/variables.js'

const CommentInputWrapper = styled.div`
  ${props =>
    props.replying &&
    `
    border-left: 8px solid ${v.colors.secondaryDarkest};
  `};
`

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
    this.focusTextArea(this.props.expanded)
  }

  componentWillReceiveProps({ expanded }) {
    this.focusTextArea(expanded)
    // NOTE: maybe preferred to leave written + unsent messages in the comment box?
    // if (!expanded) this.resetEditorState()
  }

  componentWillUnmount() {
    this.editor = null
  }

  focusTextArea = expanded => {
    // NOTE: draft-js-plugins need timeout, even with 0 delay, see:
    // https://github.com/draft-js-plugins/draft-js-plugins/issues/800#issuecomment-315950836
    setTimeout(() => {
      if (!expanded || !this.editor) return
      this.editor.focus()
    })
  }

  handleInputChange = editorState => {
    if (this.state.updating) return
    this.handleHeightChange()
    const focused = editorState.getSelection().getHasFocus()
    this.setState({
      editorState,
      focused,
    })
  }

  handleHeightChange = () => {
    const newEditorHeight = get(
      this.editor,
      'editor.editorContainer.scrollHeight'
    )

    if (!newEditorHeight) return

    if (this.editorHeight !== newEditorHeight) {
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
    this.focusTextArea(this.props.expanded)
  }

  resetEditorState() {
    this.setState({
      editorState: EditorState.push(
        this.state.editorState,
        ContentState.createFromText('')
      ),
    })
  }

  handleSubmit = e => {
    const { replyingToCommentId } = this.props.uiStore
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
    thread.API_saveComment(rawData).then(() => {
      this.props.afterSubmit()
      this.setState({ updating: false })
    })
    runInAction(() => {
      this.setState({ updating: true })
    })
    this.resetEditorState()
  }

  render() {
    const { expanded } = this.props
    const { replyingToCommentId } = this.props.uiStore
    if (!expanded) return ''

    return (
      <CommentForm onSubmit={this.handleSubmit}>
        <CommentInputWrapper
          className="textarea-input"
          replying={!!replyingToCommentId}
        >
          <CommentInput
            editorState={this.state.editorState}
            onChange={this.handleInputChange}
            handleSubmit={this.handleSubmit}
            setEditor={this.setEditor}
          />
        </CommentInputWrapper>
        <CommentEnterButton focused={this.state.focused}>
          <ReturnArrowIcon />
        </CommentEnterButton>
      </CommentForm>
    )
  }
}

CommentEntryForm.propTypes = {
  expanded: PropTypes.bool.isRequired,
  afterSubmit: PropTypes.func.isRequired,
  onHeightChange: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}

CommentEntryForm.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentEntryForm
