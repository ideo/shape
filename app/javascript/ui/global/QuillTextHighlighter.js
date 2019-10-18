import { Quill } from 'react-quill'

const Inline = Quill.import('blots/inline')

/* NOTE: we tried Parchment.Attributor.Attribute to set data attributes,
 * but it was giving us all sorts of weird formatting issues. (creating an extra <span>)
 * For whatever reason, domNode.get/setAttribute works better.
 * This is somewhat based on the LinkBlot example:
 * https://github.com/quilljs/parchment#example
 */

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
    if (name === this.constructor.blotName && value) {
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

export class QuillHighlightResolver extends QuillInlineData {}
QuillHighlightResolver.blotName = 'commentHighlightResolved'
QuillHighlightResolver.tagName = 'span'
QuillHighlightResolver.attribute = 'data-resolved-comment-id'
