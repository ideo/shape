import PropTypes from 'prop-types'
import ReactQuill from 'react-quill'
import _ from 'lodash'
import styled from 'styled-components'

import { overrideHeadersFromClipboard } from '~/ui/items/TextItem'
import v, { ITEM_TYPES } from '~/utils/variables'

const StyledTextItemCreator = styled.div`
  padding: 1rem;
  height: calc(${props => props.height}px - 2rem);
  overflow-y: scroll;
  /* hide semi-awkward scrollbar */
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;
  &::-webkit-scrollbar {
    display: none;
  }
`

class TextItemCreator extends React.Component {
  constructor(props) {
    super(props)
    // see: https://github.com/quilljs/quill/issues/1134#issuecomment-265065953
    this.onTextChange = _.debounce(this._onTextChange, 1000)
  }

  componentDidMount() {
    if (!this.quillEditor) return
    this.quillEditor.focus()
    const { editor } = this.quillEditor
    overrideHeadersFromClipboard(editor)
  }

  _onTextChange = (content, delta, source, editor) => {
    const textData = editor.getContents()
    this.setState({
      inputText: content,
      textData,
    })
  }

  createTextItem = () => {
    // make sure to capture last text change before saving
    this.onTextChange.flush()
    this.props.createCard({
      item_attributes: {
        // name will get created in Rails
        content: this.state.inputText,
        text_data: this.state.textData,
        type: ITEM_TYPES.TEXT,
      }
    })
  }

  render() {
    // re-bind enter to create the item instead of doing a linebreak
    const bindings = {
      enter: {
        key: 13,
        handler: this.createTextItem,
      },
      esc: {
        key: 27,
        handler: () => {
          this.onTextChange.cancel()
          this.props.closeBlankContentTool()
        },
      },
    }

    return (
      <StyledTextItemCreator height={this.props.height}>
        <ReactQuill
          ref={(c) => { this.quillEditor = c }}
          formats={v.quillDefaults.formats}
          placeholder="Add your text"
          onChange={this.onTextChange}
          theme={null}
          modules={{
            keyboard: { bindings }
          }}
        />
      </StyledTextItemCreator>
    )
  }
}

TextItemCreator.propTypes = {
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
}

export default TextItemCreator
