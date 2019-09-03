import _ from 'lodash'
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
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'
import styled from 'styled-components'
const stripTags = str => str.replace(/(<([^>]+)>)/gi, '')

const StyledPaddedCover = styled(PaddedCardCover)`
  border-bottom: ${props =>
    !props.isEditing && props.hasTitleText ? '2px solid black' : 'none'};
  background: ${props =>
    (!props.isEditing && !props.dragging && props.hasTitleText) ||
    props.isTransparent ||
    (props.isEditing && props.hasTitleText)
      ? v.colors.transparent
      : v.colors.white};
`

const StyledReadMore = ShowMoreButton.extend`
  z-index: ${v.zIndex.gridCard};
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.5rem;
  opacity: 0.975;
  background: ${props =>
    !props.isEditing && props.hasTitleText
      ? v.colors.transparent
      : v.colors.white};

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
    const { item, dragging, cardId, searchResult, uneditable } = this.props
    if (dragging || uiStore.dragging || this.isEditing || uneditable)
      return false
    // allow both editors/viewers to capture keyboard clicks
    if (uiStore.captureKeyboardGridClick(e, cardId)) {
      return false
    }

    if (!item.can_view) {
      uiStore.showPermissionsAlert()
      return false
    } else if (!item.can_edit_content || searchResult) {
      // if a viewer, there's nothing to do on the generic click action
      // likewise on search results, never pop open the inline editor
      return false
    }
    await apiStore.fetch('items', item.id, true)
    // store item content for later undo action
    item.pushUndo({
      snapshot: {
        data_content: this.state.item.data_content,
      },
      message: 'Text undone!',
      redirectTo: uiStore.viewingCollection,
      actionType: POPUP_ACTION_TYPES.SNACKBAR,
      // TODO: there is no way to push a redoAction because the edit hasn't happened yet!
      // so we'd have to figure out a different way to capture the redo after you undo
    })
    // entering edit mode should deselect all cards
    uiStore.deselectCards()
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

  cancel = async ({ item, ev } = {}) => {
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
    if (this.props.hideReadMore) return
    // The height of the editor is constrained to the container,
    // we must get the .ql-editor div to calculate text height
    const qlEditor = this.quillEditor.editingArea.getElementsByClassName(
      'ql-editor'
    )[0]
    const textAreaHeight = qlEditor ? qlEditor.scrollHeight : 0
    // render the Read More link if the text height exceeds viewable area
    if (height && textAreaHeight > height) {
      this.setState({ readMore: true })
    } else {
      this.setState({ readMore: false })
    }
  }

  renderEditing() {
    const { item } = this.state
    const { initialFontTag } = this.props
    if (!item) return ''
    return (
      <RealtimeTextItem
        item={item}
        currentUserId={apiStore.currentUser.id}
        onExpand={item.id ? this.expand : null}
        onCancel={this.cancel}
        initialFontTag={initialFontTag}
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

  get hasTitleText() {
    const { props } = this
    const { item } = props
    const { data_content } = item
    let hasTitle = false
    _.each(data_content.ops, op => {
      if (op.attributes && op.attributes.header === 5) {
        hasTitle = true
      }
    })
    return hasTitle
  }

  render() {
    const { isEditing, hasTitleText, props } = this
    const { isTransparent, dragging } = props
    const content = isEditing ? this.renderEditing() : this.renderDefault()

    return (
      <StyledPaddedCover
        data-cy="TextItemCover"
        style={{
          height: 'calc(100% - 30px)',
        }}
        class="cancelGridClick"
        onClick={this.handleClick}
        isEditing={isEditing}
        hasTitleText={hasTitleText}
        isTransparent={isTransparent}
        dragging={dragging}
      >
        <QuillStyleWrapper
          notEditing={!isEditing}
          hasTitleText={hasTitleText}
          smallGrid={uiStore.isSmallGrid}
        >
          {this.state.loading && <InlineLoader />}
          {content}
          {this.state.readMore && !isEditing && (
            <StyledReadMore
              onClick={this.expand}
              isEditing={isEditing}
              hasTitleText={hasTitleText}
            >
              Read more...
            </StyledReadMore>
          )}
        </QuillStyleWrapper>
      </StyledPaddedCover>
    )
  }
}

TextItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  cardId: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  initialFontTag: PropTypes.string.isRequired,
  height: PropTypes.number,
  searchResult: PropTypes.bool,
  hideReadMore: PropTypes.bool,
  uneditable: PropTypes.bool,
  isTransparent: PropTypes.bool,
}

TextItemCover.defaultProps = {
  height: null,
  searchResult: false,
  hideReadMore: false,
  uneditable: false,
  isTransparent: false,
}

export default TextItemCover
