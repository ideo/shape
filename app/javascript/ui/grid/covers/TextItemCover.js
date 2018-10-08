import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { computed } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import { apiStore, routingStore, uiStore } from '~/stores'
import v from '~/utils/variables'
import ActionCableConsumer from '~/utils/ActionCableConsumer'
import InlineLoader from '~/ui/layout/InlineLoader'
import TextItem from '~/ui/items/TextItem'
import PaddedCardCover from './PaddedCardCover'

const StyledReadMore = styled.div`
  z-index: ${v.zIndex.gridCard};
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  opacity: 0.95;
  background: white;
  font-size: 0.9rem;

  &:hover {
    background: ${v.colors.commonLightest};
  }
`
StyledReadMore.displayName = 'StyledReadMore'

@observer
class TextItemCover extends React.Component {
  constructor(props) {
    super(props)
    this.unmounted = false
  }

  state = {
    item: null,
    readMore: false,
    loading: false,
  }

  componentDidMount() {
    const { height, item } = this.props
    this.checkTextAreaHeight(height)
    this.setState({ item })
  }

  componentWillReceiveProps({ height }) {
    this.checkTextAreaHeight(height)
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  @computed
  get isEditing() {
    const { item } = this.props
    return uiStore.textEditingItem === item
  }

  handleEdit = ev => {
    const { item, dragging } = this.props
    if (dragging) return false
    if (!item.can_edit_content) return false
    // If already editing, pass event down
    if (uiStore.dragging) return false
    if (this.isEditing) {
      ev.stopPropagation()
      return false
    }
    ev.stopPropagation()
    uiStore.update('textEditingItem', this.state.item)
    return null
  }

  expand = () => {
    const { item } = this.props
    routingStore.routeTo('items', item.id)
  }

  textChange = itemTextData => {
    const { item } = this.state
    item.text_data = itemTextData
    this.setState({ item })
  }

  clearTextEditingItem = () => {
    const { item } = this.state
    if (uiStore.textEditingItem && uiStore.textEditingItem.id === item.id) {
      uiStore.update('textEditingItem', null)
    }
  }

  blur = (item, ev) => {
    if (this.unmounted) {
      return
    }
    if (ev) ev.stopPropagation()
    this.clearTextEditingItem()
    // TODO figure out why ref wasn't working
    // eslint-disable-next-line react/no-find-dom-node
    const node = ReactDOM.findDOMNode(this)
    node.scrollTop = 0
  }

  save = async (item, { cancel_sync = true } = {}) => {
    this.setState({ loading: true })
    await item.API_updateWithoutSync({ cancel_sync })
    this.clearTextEditingItem()
    if (this.unmounted) {
      return
    }
    this.setState({ loading: false, item })
    // TODO figure out why ref wasn't working
    // eslint-disable-next-line react/no-find-dom-node
    const node = ReactDOM.findDOMNode(this)
    node.scrollTop = 0
  }

  checkTextAreaHeight = height => {
    if (!this.quillEditor) return
    const textAreaHeight = this.quillEditor.getEditingArea().offsetHeight
    // render the Read More link if the text height exceeds viewable area
    if (height && textAreaHeight > height) {
      this.setState({ readMore: true })
    } else {
      this.setState({ readMore: false })
    }
  }

  renderEditing() {
    const { item } = this.state
    if (!item) return ''
    return (
      <TextItem
        item={item}
        actionCableConsumer={ActionCableConsumer}
        currentUserId={apiStore.currentUser.id}
        onUpdatedData={this.textChange}
        onSave={this.save}
        onExpand={item.id ? this.expand : null}
        onCancel={this.blur}
      />
    )
  }

  renderDefault() {
    const { item } = this.props
    const textData = item.toJSON().text_data
    const quillProps = {
      // ref is used to get the height of the div in checkTextAreaHeight
      ref: c => {
        this.quillEditor = c
      },
      readOnly: true,
      theme: null,
    }

    return <ReactQuill {...quillProps} value={textData} />
  }

  render() {
    const { isEditing } = this
    const content = isEditing ? this.renderEditing() : this.renderDefault()
    return (
      <PaddedCardCover
        data-cy="TextItemCover"
        style={{
          height: 'calc(100% - 30px)',
          overflowX: 'hidden',
          overflowY: isEditing ? 'auto' : 'hidden',
        }}
        class="cancelGridClick"
        onClick={this.handleEdit}
      >
        {this.state.loading && <InlineLoader />}
        {content}
        {this.state.readMore &&
          !isEditing && (
            <StyledReadMore onClick={this.expand}>read more...</StyledReadMore>
          )}
      </PaddedCardCover>
    )
  }
}

TextItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  height: PropTypes.number,
}

TextItemCover.defaultProps = {
  height: null,
}

export default TextItemCover
