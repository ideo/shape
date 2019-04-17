import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { computed } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'

import { apiStore, routingStore, uiStore } from '~/stores'
import v from '~/utils/variables'
import { ShowMoreButton } from '~/ui/global/styled/forms'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import InlineLoader from '~/ui/layout/InlineLoader'
import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import PaddedCardCover from './PaddedCardCover'

const stripTags = str => str.replace(/(<([^>]+)>)/gi, '')

const StyledReadMore = ShowMoreButton.extend`
  z-index: ${v.zIndex.gridCard};
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.5rem;
  opacity: 0.975;
  background: white;

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

  handleClick = async e => {
    e.stopPropagation()
    const { item, dragging, cardId, searchResult } = this.props
    if (dragging || uiStore.dragging || this.isEditing) return false
    // allow both editors/viewers to capture keyboard clicks
    if (uiStore.captureKeyboardGridClick(e, cardId)) {
      return false
    }
    if (!item.can_edit_content || searchResult) {
      // if a viewer, there's nothing to do on the generic click action
      // likewise on search results, never pop open the inline editor
      return false
    }
    await apiStore.fetch('items', item.id, true)
    uiStore.update('textEditingItem', this.state.item)
    return null
  }

  expand = () => {
    const { item } = this.props
    routingStore.routeTo('items', item.id)
  }

  clearTextEditingItem = () => {
    const { item } = this.state
    if (uiStore.textEditingItem && uiStore.textEditingItem.id === item.id) {
      uiStore.update('textEditingItem', null)
    }
  }

  blur = async (item, ev) => {
    if (this.unmounted) {
      return
    }
    if (ev && ev.stopPropagation) ev.stopPropagation()
    this.clearTextEditingItem()
    const hasContent = stripTags(item.content).length
    if (!hasContent) {
      // archive empty text item when you hit "X"
      const card = apiStore.find('collection_cards', this.props.cardId)
      card.API_archiveSelf({ undoable: false })
      return
    }
    // save final updates and broadcast to collection
    item.API_updateWithoutSync()

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
      <RealtimeTextItem
        item={item}
        currentUserId={apiStore.currentUser.id}
        onExpand={item.id ? this.expand : null}
        onCancel={this.blur}
        // if we are rendering editing then the item has been fetched
        fullyLoaded
      />
    )
  }

  renderDefault() {
    const { item } = this.props
    const textData = item.toJSON().data_content
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
        onClick={this.handleClick}
      >
        <QuillStyleWrapper>
          {this.state.loading && <InlineLoader />}
          {content}
          {this.state.readMore &&
            !isEditing && (
              <StyledReadMore onClick={this.expand}>
                Read more...
              </StyledReadMore>
            )}
        </QuillStyleWrapper>
      </PaddedCardCover>
    )
  }
}

TextItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  cardId: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  height: PropTypes.number,
  searchResult: PropTypes.bool,
}

TextItemCover.defaultProps = {
  height: null,
  searchResult: false,
}

export default TextItemCover
