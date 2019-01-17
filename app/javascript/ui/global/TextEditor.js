import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import { FormButton } from '~/ui/global/styled/forms'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import v from '~/utils/variables'

const EditorWrapper = styled.div`
  background: white;
  maxwidth: 850px;
  padding: 6px 10px;

  #quill-toolbar {
    margin-bottom: 5px;
  }
`

@observer
class TextEditor extends React.Component {
  constructor() {
    super()
    this.quillEditor = undefined
  }

  componentDidMount() {
    this.attachQuillRefs()
  }

  componentDidUpdate() {
    this.attachQuillRefs()
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  handleChange = (content, delta, source, editor) => {
    const { quillEditor } = this
    const { item } = this.props
    setTimeout(() => {
      runInAction(() => {
        item.content = quillEditor.root.innerHTML
        item.text_data = quillEditor.getContents()
      })
    }, 5)
  }

  handleBlur = (range, source, editor) => {
    const selection = editor.getSelection()
    if (selection) {
      // we just pasted... so blur + refocus to stay within the editor
      this.quillEditor.blur()
      this.quillEditor.focus()
    }
  }

  handleSave = ev => {
    ev.preventDefault()
    const { item } = this.props
    item.save()
  }

  get textData() {
    const { item } = this.props
    return item.toJSON().text_data
  }

  render() {
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      readOnly: false,
      modules: {
        toolbar: '#quill-toolbar',
      },
    }
    return (
      <form>
        <EditorWrapper>
          <TextItemToolbar fullPageView onExpand={() => {}} />
          <QuillStyleWrapper>
            <ReactQuill {...quillProps} value={this.textData} />
          </QuillStyleWrapper>
        </EditorWrapper>
        <FormButton onClick={this.handleSave}>Save</FormButton>
      </form>
    )
  }
}

TextEditor.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TextEditor
