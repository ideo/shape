import { Quill } from 'react-quill'
import { apiStore } from '~/stores'

/* NOTE: we tried Parchment.Attributor.Attribute to set data attributes,
 * but it was giving us all sorts of weird formatting issues. (creating an extra <span>)
 * For whatever reason, domNode.get/setAttribute works better.
 * This is somewhat based on the LinkBlot example:
 * https://github.com/quilljs/parchment#example

 * Additionally, the highlight and resolved highlight needed a non-<span> tag to behave properly,
 * and if they both used <sub> they would sometimes interfere with each other on the same line.
 * This is why they use <sub> and <sup> and then we just style those elements to look appropriately in typography.js.
 * All these workarounds are due to wanting to add a clickable element that stores a data-attr.

 * One last note is that <sub/sup> are not stored at all in the database, this is purely just to give Quill a way
 * to render `{attributes: {commentHighlight: 123}}` in an inline clickable format that it understands.
 * This means you can smoothly change the frontend handling of those attributes in this file,
 * without needing to change/migrate the data.
 */

const Inline = Quill.import('blots/inline')

export class QuillInlineData extends Inline {
  static create(value) {
    const node = super.create()
    node.setAttribute(this.attribute, value)
    return node
  }

  static formats(domNode) {
    return domNode.getAttribute(this.attribute)
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
      node.onclick = async e => {
        e.preventDefault()
        const commentId = QuillHighlighter.formats(node)
        apiStore.openCommentFromHighlight(commentId)
      }
    }
    return node
  }
}

// see notes at top regarding <sub>/<sup> element reasoning
QuillHighlighter.blotName = 'commentHighlight'
QuillHighlighter.tagName = 'sub'
QuillHighlighter.attribute = 'data-comment-id'

export class QuillHighlightResolver extends QuillInlineData {}
QuillHighlightResolver.blotName = 'commentHighlightResolved'
QuillHighlightResolver.tagName = 'sup'
QuillHighlightResolver.attribute = 'data-resolved-comment-id'
