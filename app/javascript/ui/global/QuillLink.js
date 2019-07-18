import { Quill } from 'react-quill'

const Link = Quill.import('formats/link')
const URL_REGEX = /https?:\/\/[\w\-\._<>]+\.[a-zA-Z]{2,6}[\w\-\._?=%<>\-&\/]*/

class QuillLink extends Link {
  static create(value) {
    const node = super.create(value)
    const sanitizedValue = this.sanitize(value)
    node.setAttribute('href', sanitizedValue)
    if (sanitizedValue.search(URL_REGEX) === -1) {
      node.removeAttribute('target')
    }
    return node
  }
}
export default QuillLink
