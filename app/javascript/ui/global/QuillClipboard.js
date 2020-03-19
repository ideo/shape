import Quill from 'quill'
import Delta from 'quill-delta'

const Clipboard = Quill.import('modules/clipboard')

// convert pasting contents to plain text: https://stackoverflow.com/a/51255601
// mostly adapted from original onPaste method: https://github.com/quilljs/quill/blob/v1.3.6/modules/clipboard.js
class QuillClipboard extends Clipboard {
  constructor(quill, options) {
    super(quill, options)
    const headers = ['H3', 'H4', 'H6']
    headers.forEach(header => {
      this.addMatcher(header, this.remapUnsupportedHeaderToH2)
    })
    this.addMatcher('span', this.preserveSpanSizeFormat)
  }

  remapUnsupportedHeaderToH2(node, delta) {
    delta.map(op => {
      if (!op.attributes) op.attributes = {}
      op.attributes.header = 2
      return op
    })
    return delta
  }

  // https://github.com/quilljs/quill/issues/1083
  preserveSpanSizeFormat(node, delta) {
    const match = node.className.match(/ql-size-(.*)/)
    if (match) {
      delta.map(op => {
        if (!op.attributes) op.attributes = {}
        // grab the size from `ql-size-{x}`
        op.attributes.size = match[1]
        return op
      })
    }
    return delta
  }

  onPaste(e) {
    e.preventDefault() // this will prevent the parent class onPaste
    const { quill } = this
    const range = quill.getSelection()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    setTimeout(() => {
      let newDelta = this.convert(html)
      if (!newDelta.ops.length) {
        newDelta = new Delta().insert(text)
      }
      const delta = new Delta().retain(range.index).concat(newDelta)

      quill.updateContents(delta, Quill.sources.USER)
      quill.setSelection(delta.length(), Quill.sources.SILENT)
      quill.scrollIntoView()
    }, 1)
  }
}

export default QuillClipboard
