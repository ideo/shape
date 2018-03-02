import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import TextItemToolbar from '~/ui/items/TextItemToolbar'

const StyledContainer = styled.div`
  padding: 2rem 0.5rem;
`

const remapHeaderToH3 = (node, delta) => {
  delta.map((op) => (op.attributes.header = 3))
  return delta
}

class TextItem extends React.Component {
  constructor(props) {
    super(props)
    this.onTextChange = _.debounce(this._onTextChange, 1000)
  }

  componentDidMount() {
    if (!this.quillEditor) return
    if (this.props.editable) {
      const { editor } = this.quillEditor
      // change all non-H3 header attributes to H3, e.g. when copy/pasting
      editor.clipboard.addMatcher('H1', remapHeaderToH3)
      editor.clipboard.addMatcher('H2', remapHeaderToH3)
      editor.clipboard.addMatcher('H4', remapHeaderToH3)
      editor.clipboard.addMatcher('H5', remapHeaderToH3)
      editor.clipboard.addMatcher('H6', remapHeaderToH3)
    }
  }

  _onTextChange = (content, delta, source, editor) => {
    const { item } = this.props
    const textData = editor.getContents()
    item.content = content
    item.text_data = textData
    item.save()
  }

  render() {
    const { item, editable } = this.props

    // we have to convert the item to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    let quillProps = {}
    if (editable) {
      quillProps = {
        ...v.quillDefaults,
        ref: c => { this.quillEditor = c },
        theme: 'snow',
        onChange: this.onTextChange,
        modules: {
          toolbar: '#quill-toolbar',
        },
      }
    } else {
      // for users who only have read access to this TextItem
      quillProps = {
        readOnly: true,
        theme: null,
      }
    }

    return (
      <StyledContainer>
        { editable && <TextItemToolbar closePath={item.parentPath} /> }
        <ReactQuill
          {...quillProps}
          value={textData}
        />
      </StyledContainer>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  editable: PropTypes.bool,
}

TextItem.defaultProps = {
  editable: false,
}

export default TextItem
