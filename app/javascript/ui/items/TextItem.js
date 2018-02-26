import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import _ from 'lodash'
import styled from 'styled-components'

import { routingStore } from '~/stores'
import v from '~/utils/variables'
import TextItemToolbar from '~/ui/items/TextItemToolbar'

export const StyledCard = styled.div`
  padding: ${props => props.padding};
`

export const StyledReadMore = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  opacity: 0.95;
  background: white;
  font-size: 0.9rem;

  &:hover {
    background: #f1f1f1;
  }
`

class TextItem extends React.Component {
  constructor(props) {
    super(props)

    this.onTextChange = _.debounce(this._onTextChange, 1000)
    this.state = {
      readMore: false,
    }
  }

  componentDidMount() {
    if (this.props.editable) return
    const h = this.quillEditor.getEditingArea().offsetHeight
    if (h > 250) {
      this.setState({ readMore: true })
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
    const { item, padding, editable } = this.props

    // we have to convert the item to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    let quillProps = {}
    if (editable) {
      quillProps = {
        ...v.quillDefaults,
        theme: 'snow',
        onChange: this.onTextChange,
        modules: {
          toolbar: '#quill-toolbar',
        },
      }
    } else {
      quillProps = {
        readOnly: true,
        theme: null,
        // ref is used to get the height of the div in componentDidMount
        ref: c => { this.quillEditor = c },
      }
    }

    // simple way to "go back" to the previous breadcrumb
    // NOTE: what if we want "x" to actually goBack i.e. w/ routing history?
    //  -- particularly if you were jumping in/out of "referenced" items
    const [type, id] = item.breadcrumb[item.breadcrumb.length - 2]
    const closePath = routingStore.pathTo(type, id)

    return (
      <div>
        <StyledCard padding={padding}>
          { editable && <TextItemToolbar closePath={closePath} /> }

          <ReactQuill
            {...quillProps}
            value={textData}
          />
        </StyledCard>
        { this.state.readMore && <StyledReadMore>read more...</StyledReadMore> }
      </div>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  padding: PropTypes.string,
  editable: PropTypes.bool,
}

TextItem.defaultProps = {
  padding: '1rem',
  editable: false,
}

export default TextItem
