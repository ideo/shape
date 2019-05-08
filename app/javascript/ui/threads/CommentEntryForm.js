import PropTypes from 'prop-types'
import { toJS, observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import { get } from 'lodash'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import { CommentForm } from '~/ui/global/styled/forms'
import CommentInput from './CommentInput'

@observer
class CommentEntryForm extends React.Component {
  @observable
  commentData = {
    message: '',
    draftjs_data: {},
  }
  @observable
  updating = false
  editorHeight = null
  state = {
    editorState: EditorState.createEmpty(),
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

  @action
  handleInputChange = editorState => {
    if (this.updating) return
    const content = editorState.getCurrentContent()
    const message = content.getPlainText()
    this.commentData.message = message
    this.commentData.draftjs_data = convertToRaw(content)
    this.handleHeightChange()
    this.setState({
      editorState,
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
    e.preventDefault()
    const rawData = toJS(this.commentData)
    // don't allow submit of empty comment
    if (!rawData.message) return
    const { thread } = this.props
    thread.API_saveComment(rawData).then(() => {
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
      <CommentForm onSubmit={this.handleSubmit}>
        <div className="textarea-input">
          <CommentInput
            editorState={this.state.editorState}
            onChange={this.handleInputChange}
            handleSubmit={this.handleSubmit}
            setEditor={this.setEditor}
            readOnly={false}
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
