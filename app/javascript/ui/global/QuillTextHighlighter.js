import { Quill } from 'react-quill'

const Inline = Quill.import('blots/inline')
// const Parchment = Quill.import('parchment')

// const dataAttributor = new Parchment.Attributor.Attribute(
//   'data-comment-id',
//   'data-comment-id'
// )
// Quill.register(dataAttributor)
//
// const dataAttributorResolved = new Parchment.Attributor.Attribute(
//   'data-resolved-comment-id',
//   'data-resolved-comment-id'
// )
// Quill.register(dataAttributorResolved)
//
// const highlightStyleAttributor = new Parchment.Attributor.Class(
//   'highlight',
//   'highlighted'
// )
// Quill.register(highlightStyleAttributor)

export class QuillInlineData extends Inline {
  static create(value) {
    const node = super.create()
    node.setAttribute(this.attribute, value)
    return node
  }

  static formats(domNode) {
    return domNode.getAttribute(this.attribute) || true
  }

  format(name, value) {
    if (name === 'commentHighlight' && value) {
      this.domNode.setAttribute(this.constructor.attribute, value)
    } else {
      super.format(name, value)
    }
  }

  formats() {
    const formats = super.formats()
    formats[this.blotName] = this.constructor.formats(this.domNode)
    return formats
  }
}

export class QuillHighlighter extends QuillInlineData {
  static create(value) {
    const node = super.create(value)
    if (value) {
      node.onclick = e => {
        e.preventDefault()
        console.log('clicked highlight', QuillHighlighter.formats(node))
      }
    }
    return node
  }
}

QuillHighlighter.blotName = 'commentHighlight'
QuillHighlighter.tagName = 'sub'
QuillHighlighter.attribute = 'data-comment-id'

// export class QuillHighlightResolver extends QuillInlineData {}
// QuillHighlightResolver.blotName = 'commentHighlightResolved'
// QuillHighlightResolver.tagName = 'span'
// QuillHighlightResolver.attributor = dataAttributorResolved
