import { Quill } from 'react-quill'

const Inline = Quill.import('blots/inline')
const Parchment = Quill.import('parchment')

const dataAttributor = new Parchment.Attributor.Attribute(
  'data-comment-id',
  'data-comment-id'
)
Quill.register(dataAttributor)

class QuillTextHighlighter extends Inline {
  static create(value) {
    // NOTE: highlight uses <sub> as its HTML element
    let node = document.createElement('sub')
    let disabled = false
    if (value.indexOf('-resolved') > -1) {
      // quill ops with -resolved will get no highlight
      disabled = true
      node = document.createElement('span')
    }

    if (value) {
      dataAttributor.add(node, value)
    } else {
      dataAttributor.remove(node)
    }

    // add onClick handler...
    if (value && !disabled) {
      node.onclick = e => {
        e.preventDefault()
        // apiStore.find('comments', value)
        console.log('here i am...', dataAttributor.value(node))
      }
    }
    return node
  }

  static formats(node) {
    // preserve data attribute if already set
    return dataAttributor.value(node)
  }
}

QuillTextHighlighter.blotName = 'commentHighlight'
QuillTextHighlighter.tagName = ['sub', 'span']

export default QuillTextHighlighter
