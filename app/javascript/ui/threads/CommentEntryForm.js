import PropTypes from 'prop-types'
import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, ContentState, convertToRaw } from 'draft-js'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { CommentForm } from '~/ui/global/styled/forms'
import CommentInput from './CommentInput'

@observer
class CommentEntryForm extends React.Component {
  @observable commentData = {
    message: '',
    draftjs_data: {},
  }
  @observable suggestionsOpen = false
  @observable updating = false
  state = {
    editorState: EditorState.createEmpty()
  }

  componentDidMount() {
    this.focusTextArea(this.props.expanded)
  }

  componentWillReceiveProps({ expanded }) {
    this.focusTextArea(expanded)
    // NOTE: maybe preferred to leave written + unsent messages in the comment box?
    // if (!expanded) this.resetEditorState()
  }

  focusTextArea = (expanded) => {
    if (expanded && this.editor) {
      this.editor.focus()
    }
  }

  @action handleInputChange = (editorState) => {
    if (this.updating) return
    const content = editorState.getCurrentContent()
    const message = content.getPlainText()
    this.commentData.message = message
    this.commentData.draftjs_data = convertToRaw(content)
    this.setState({
      editorState
    })
  }

  setEditor = (editor) => {
    this.editor = editor
  }

  resetEditorState() {
    this.setState({
      editorState: EditorState.push(this.state.editorState, ContentState.createFromText(''))
    })
  }

  @action handleOpenSuggestions = () => {
    this.suggestionsOpen = true
  }

  @action handleCloseSuggestions = () => {
    this.suggestionsOpen = false
  }

  handleReturn = (e) => {
    if (!e.shiftKey && !this.suggestionsOpen) {
      // submit message
      this.handleSubmit(e)
      return 'handled'
    }
    return 'not-handled'
  }

  handleSubmit = (e) => {
    e.preventDefault()
    if (!this.commentData.message) return
    const { thread } = this.props
    thread.API_saveComment(this.commentData).then(() => {
      this.props.afterSubmit()
      this.updating = false
    })
    runInAction(() => {
      this.commentData.message = ''
      this.commentData.draftjs_data = {}
      this.updating = true
    })
    this.resetEditorState()
  }

  render() {
    const { expanded } = this.props
    if (!expanded) return ''

    return (
      <CommentForm className="reply" onSubmit={this.handleSubmit}>
        <div className="textarea-input">
          <CommentInput
            editorState={this.state.editorState}
            onChange={this.handleInputChange}
            onOpenSuggestions={this.handleOpenSuggestions}
            onCloseSuggestions={this.handleCloseSuggestions}
            handleReturn={this.handleReturn}
            setEditor={this.setEditor}
          />
        </div>
        <button>
          <ReturnArrowIcon />
        </button>
      </CommentForm>
    )
  }
}

CommentEntryForm.propTypes = {
  expanded: PropTypes.bool.isRequired,
  afterSubmit: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentEntryForm
