import Quill from 'quill'
const Clipboard = Quill.import('modules/clipboard')
const Delta = Quill.import('delta')

class QuillClipboard extends Clipboard {
  // convert pasting contents to plain text: https://stackoverflow.com/a/51255601
  onPaste(e) {
    e.preventDefault() // this will call the parent class onPaste
    const range = this.quill.getSelection()
    const text = e.clipboardData.getData('text/plain')
    const delta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert(text)
    this.quill.updateContents(delta, Quill.sources.USER)
    this.quill.setSelection(delta.length() - range.length, Quill.sources.SILENT)
    this.quill.scrollIntoView()
  }
}

export default QuillClipboard
