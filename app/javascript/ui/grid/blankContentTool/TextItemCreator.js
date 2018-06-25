import PropTypes from 'prop-types'
import { observable, observe, runInAction } from 'mobx'
import ReactQuill from 'react-quill'
import _ from 'lodash'
import styled from 'styled-components'

import ActionCableConsumer from '~/utils/ActionCableConsumer'
import Item from '~/stores/jsonApi/Item'
import { overrideHeadersFromClipboard } from '~/ui/items/TextItem'
import v, { ITEM_TYPES, KEYS } from '~/utils/variables'
import { apiStore, routingStore, uiStore } from '~/stores'
import TextItem from '~/ui/items/TextItem'

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
    this.item = new Item()
    this.item.can_edit = true
  }

  _onTextChange = (itemTextData) => {
    this.item.text_data = itemTextData
  }

  expand() {
    routingStore.routeTo('items', this.item.id)
  }

  onCancel = (item) => {
    console.log('item content', item.content)
    if (item.content) {
      this.createTextItem(item)
    } else {
      this.props.closeBlankContentTool()
    }
  }

  createTextItem = (item) => {
    if (this.props.loading) return
    // make sure to capture last text change before saving
    this.onTextChange.flush()
    console.log('createtextitem', this.props)
    this.props.createCard({
      item_attributes: {
        // name will get created in Rails
        content: this.item.content,
        text_data: this.item.text_data,
        type: ITEM_TYPES.TEXT,
      }
    })
  }

  render() {
    // re-bind enter to create the item instead of doing a linebreak
    const bindings = {
      esc: {
        key: KEYS.ESC,
        handler: () => {
          this.onTextChange.cancel()
          this.props.closeBlankContentTool()
        },
      },
    }

    return (
      <StyledTextItemCreator height={this.props.height}>
        <TextItem
          item={this.item}
          actionCableConsumer={ActionCableConsumer}
          currentUserId={apiStore.currentUser.id}
          onUpdatedData={this.onTextChange}
          onCancel={this.onCancel}
          onSave={this.createTextItem}
          onExpand={this.item.id ? this.expand : null}
        />
      </StyledTextItemCreator>
    )
  }
}

TextItemCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
}

export default TextItemCreator
