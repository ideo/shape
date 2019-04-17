import PropTypes from 'prop-types'
import _ from 'lodash'
import styled from 'styled-components'

import Item from '~/stores/jsonApi/Item'
import ActionCableConsumer from '~/utils/ActionCableConsumer'
import { ITEM_TYPES } from '~/utils/variables'
import { apiStore, routingStore } from '~/stores'
import TextItem from '~/ui/items/TextItem'

const StyledTextItemCreator = styled.div`
  background: white;
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
    this.item = new Item({ data_content: {} })
    this.item.can_edit_content = true
  }

  _onTextChange = itemTextData => {
    this.item.data_content = itemTextData
  }

  expand() {
    routingStore.routeTo('items', this.item.id)
  }

  onCancel = item => {
    if (item.justText) {
      this.createTextItem(item)
    } else {
      this.props.closeBlankContentTool()
    }
  }

  createTextItem = item => {
    if (this.props.loading) return
    // make sure to capture last text change before saving
    this.onTextChange.flush()
    this.props.createCard({
      item_attributes: {
        // name will get created in Rails
        content: this.item.content,
        data_content: this.item.data_content,
        type: ITEM_TYPES.TEXT,
      },
    })
  }

  render() {
    const { item } = this
    const { height } = this.props

    return (
      <StyledTextItemCreator height={height}>
        <TextItem
          item={item}
          actionCableConsumer={ActionCableConsumer}
          currentUserId={apiStore.currentUser.id}
          onUpdatedData={this.onTextChange}
          onCancel={this.onCancel}
          onSave={this.createTextItem}
          onExpand={item.id ? this.expand : null}
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
