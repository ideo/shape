import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Delta from 'quill-delta'
import ReactQuill, { Quill } from 'react-quill'
// NOTE: quill-cursors injects a bunch of .ql-xx related styles into the <head>
import QuillCursors from 'quill-cursors'
import styled from 'styled-components'

import ChannelManager from '~/utils/ChannelManager'
import { CloseButton } from '~/ui/global/styled/buttons'
import QuillLink from '~/ui/global/QuillLink'
import {
  QuillHighlighter,
  QuillHighlightResolver,
} from '~/ui/global/QuillTextHighlighter'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import { routingStore } from '~/stores'
import v from '~/utils/variables'
import QuillClipboard from '~/ui/global/QuillClipboard'

Quill.debug('error')
Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/customClipboard', QuillClipboard)
Quill.register('formats/link', QuillLink)
Quill.register(QuillHighlighter)
Quill.register(QuillHighlightResolver)

const Keyboard = Quill.import('modules/keyboard')

const FULL_PAGE_TOP_PADDING = '2rem'
const DockedToolbar = styled.div`
  background: white;
  box-sizing: border-box;
  height: 32px;
  left: 0;
  margin-bottom: 20px;
  padding: 5px 10px 0;
  position: absolute;
  width: 100%;
  z-index: ${v.zIndex.gridCardTop};
  opacity: 0.95;
  ${props =>
    props.fullPageView &&
    `
      margin-top: -${FULL_PAGE_TOP_PADDING};
      position: relative; /* IE fallback */
      padding-left: 0;
      @supports (position: sticky) {
        top: ${v.headerHeight}px;
        position: sticky;
      }
    `};
  ${props =>
    !props.fullPageView &&
    `
      top: 5px;
    `};
`

const StyledContainer = styled.div`
  padding-top: 25px;

  ${props =>
    props.fullPageView &&
    `
    height: 100%;
    padding: ${FULL_PAGE_TOP_PADDING} 0.5rem;`};
  ${props =>
    props.loading &&
    `
    background: gray;
  `} .editor-pill {
    ${props =>
      !props.fullPageView &&
      `
      bottom: 0;
      padding: 10px;
      position: absolute;
      top: 0;
      z-index: 10000;
    `};
  }
  ${props =>
    !props.fullPageView &&
    `
    height: calc(100% - 25px);
    .ql-tooltip.ql-editing,
    .ql-tooltip.ql-flip {
      left: calc(50% - 150px) !important;
      top: -20px !important;
      position: fixed;
      z-index: 10000;
    }
  `}
`

@inject('uiStore', 'apiStore')
@observer
class RealtimeTextItem extends React.Component {
  channelName = 'ItemRealtimeChannel'
  state = { disconnected: false }
  saveTimer = null
  focused = false
  currentlySending = false
  currentlySendingCheck = null
  combinedDelta = new Delta()
  bufferDelta = new Delta()
  contentSnapshot = new Delta()

  constructor(props) {
    super(props)
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.sendCombinedDelta = _.debounce(this._sendCombinedDelta, 200)
    this.sendCursor = _.throttle(this._sendCursor, 100)
  }

  componentDidMount() {
    this.subscribeToItemRealtimeChannel()
    setTimeout(() => {
      this.subscribeToItemRealtimeChannel()
    }, 1250)

    if (!this.reactQuillRef) return
    this.initQuillRefsAndData({ initSnapshot: true })
    setTimeout(() => {
      this.quillEditor.focus()
    }, 100)
  }

  componentDidUpdate(prevProps) {
    const initSnapshot = !prevProps.fullyLoaded && this.props.fullyLoaded
    // if we just "fully loaded" then make sure to update this.contentSnapshot and version
    this.initQuillRefsAndData({ initSnapshot })
  }

  componentWillUnmount() {
    this.sendCombinedDelta.flush()
    this.unmounted = true
    // this will set the datx item to have the right data, but do not want to route back
    this.cancel(null, { route: false })
    // check if you're leaving to go to the same item, e.g. item on CollectionPage -> ItemPage
    // in which case we keep the channel open
    const { routingTo } = routingStore
    const { item } = this.props
    const routingToSameItem =
      routingTo.id === item.id && routingTo.type === 'items'
    ChannelManager.unsubscribeAllFromChannel(this.channelName, {
      keepOpen: routingToSameItem,
    })
  }

  subscribeToItemRealtimeChannel() {
    const { item } = this.props
    this.channel = ChannelManager.subscribe(this.channelName, item.id, {
      channelConnected: this.channelConnected,
      channelDisconnected: this.channelDisconnected,
      channelReceivedData: this.channelReceivedData,
    })
  }

  initQuillRefsAndData = ({ initSnapshot } = {}) => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()

    if (!initSnapshot) return
    this.contentSnapshot = this.quillEditor.getContents()
  }

  get version() {
    return this.props.item.version
  }

  createCursor({ id, name }) {
    const cursors = this.quillEditor.getModule('cursors')
    cursors.createCursor(id, name, v.colors.tertiaryMedium)
  }

  channelConnected = () => {
    if (this.unmounted) return
    this.setState({ disconnected: false })
  }

  channelDisconnected = (message = 'Disconnected from channel') => {
    if (this.unmounted) return
    // TODO: do anything here? try to reconnect?
    console.warn(message)
    const { fullPageView } = this.props
    if (!fullPageView) {
      // this will cancel you out of the editor back to view-only mode
      this.cancel()
      return
    }
    // this will likewise put you into readOnly mode on the ItemPage
    this.setState({ disconnected: true })
  }

  channelReceivedData = ({ current_editor, data }) => {
    if (this.unmounted) return
    if (data && data.version) {
      this.handleReceivedDelta({ current_editor, data })
    }
    if (data && data.range) {
      this.handleReceivedRange({ current_editor, data })
    }
  }

  handleReceivedRange = ({ current_editor, data }) => {
    if (current_editor.id === this.props.currentUserId) return
    // createCursor is like a find_or_create
    this.createCursor(current_editor)
    const cursors = this.quillEditor.getModule('cursors')
    cursors.moveCursor(current_editor.id, data.range)
  }

  handleReceivedDelta = ({ current_editor, data }) => {
    const { item, currentUserId } = this.props

    // update our local version number
    if (data.version) {
      if (!data.error && data.last_10) {
        const diff = data.version - item.version
        if (diff > 0) {
          _.each(data.last_10, previous => {
            const delta = new Delta(previous.delta)
            if (previous.version > item.version) {
              if (previous.editor_id !== currentUserId) {
                this.applyIncomingDelta(delta)
              }
              // update for later sending appropriately composed version to be saved
              this.contentSnapshot = this.contentSnapshot.compose(delta)
              // set our local item.version to match the realtime data we got
              item.version = previous.version
            }
          })
        }
      }
    }

    if (current_editor.id === currentUserId) {
      // now we can successfully say that our delta was sent/received
      clearTimeout(this.currentlySendingCheck)
      this.currentlySendingCheck = null
      this.currentlySending = false
      if (data.error) {
        return
      }
      // clear out our combinedDelta with whatever had been typed in the meantime
      this.combinedDelta = this.bufferDelta.slice()
      if (this.combinedDelta.length()) {
        // if we had some waiting content
        this.sendCombinedDelta()
      }
    }
    if (this.focused) this.sendCursor()
  }

  applyIncomingDelta(remoteDelta) {
    // this.quillEditor may not exist in unit tests
    if (this.quillEditor) {
      // apply the incoming other person's delta, accounting for our own changes,
      // but prioritizing theirs
      const remoteDeltaWithLocalChanges = this.combinedDelta.transform(
        remoteDelta
      )
      // make sure our local editor is up to date with changes.
      this.quillEditor.updateContents(remoteDeltaWithLocalChanges, 'silent')
      // persist local changes
      this.setItemQuillData()
    }

    if (this.combinedDelta.length()) {
      // transform our awaiting content, prioritizing the remote delta
      this.combinedDelta = remoteDelta.transform(this.combinedDelta, true)
    }
  }

  get canEdit() {
    const { item, fullyLoaded } = this.props
    const { disconnected } = this.state
    return item.can_edit_content && fullyLoaded && !disconnected
  }

  get quillData() {
    const { item } = this.props
    const quillData = toJS(item.quill_data)
    // Set initial font size - if text item is blank,
    // and user has chosen a h* tag (e.g. h1)
    // (p tag does not require any ops changes)
    if (
      quillData &&
      quillData.ops &&
      quillData.ops.length === 0 &&
      this.headerSize
    ) {
      quillData.ops.push({
        insert: '\n',
        attributes: { header: this.headerSize },
      })
    }
    return quillData
  }

  cancel = (ev, { route = true } = {}) => {
    const { onCancel } = this.props
    // NOTE: cancel also means "save current text"!
    // event is passed through because TextItemCover uses it
    if (!this.canEdit) return onCancel({ item: this.props.item, ev, route })
    const item = this.setItemQuillData()
    return onCancel({ item, ev, route })
  }

  @action
  setItemQuillData(fullContent = null) {
    const { item } = this.props
    const { quillEditor } = this
    if (quillEditor) {
      item.content = quillEditor.root.innerHTML
    }
    const delta = fullContent || (quillEditor && quillEditor.getContents())

    item.quill_data = new Delta(delta)
    return item
  }

  get headerSize() {
    const { initialFontTag } = this.props
    if (initialFontTag.includes('H')) {
      return _.replace(initialFontTag, 'H', '')
    }
    return null
  }

  newlineIndicesForDelta = delta => {
    const newlineOpIndices = []
    _.each(delta.ops, (op, index) => {
      if (op.insert && op.insert.includes('\n')) newlineOpIndices.push(index)
    })
    return newlineOpIndices
  }

  headerFromLastNewline = delta => {
    // Check if user added newline
    // And if so, set their default text size if provided
    const newlineOpIndices = this.newlineIndicesForDelta(delta)
    // Return if there wasn't a specified header size in previous newline operation
    const prevHeaderSizeOp = delta.ops[_.last(newlineOpIndices)]
    if (!prevHeaderSizeOp.attributes || !prevHeaderSizeOp.attributes.header) {
      return null
    }
    return prevHeaderSizeOp.attributes.header
  }

  adjustHeaderSizeIfNewline = delta => {
    // Check if user added newline
    // And if so, set their default text size if provided
    if (this.newlineIndicesForDelta(delta).length === 0) return

    const prevHeader = this.headerFromLastNewline(delta)
    if (!prevHeader) return

    // Apply previous line's header size to last operation
    const lastOp = _.last(delta.ops)
    if (!lastOp.attributes) {
      lastOp.attributes = { header: prevHeader }
    } else if (lastOp.attributes.header) {
      return
    } else {
      // remove lastOp, which is a `retain: 1` and causes the newline to be <p>
      // NOTE: mutating this delta seems to automatically apply the change?
      delta.ops.pop()
    }
  }

  get cardId() {
    const { item } = this.props
    if (item.parent_collection_card) {
      return item.parent_collection_card.id
    } else {
      return null
    }
  }

  handleTextChange = (_content, delta, source, _editor) => {
    if (source !== 'user') return
    // This adjustment is made so that the currently-selected
    // header size is preserved on new lines
    this.adjustHeaderSizeIfNewline(delta)
    const cursors = this.quillEditor.getModule('cursors')
    cursors.clearCursors()

    this.combineAwaitingDeltas(delta)
    this.sendCombinedDelta()
  }

  handleSelectionChange = (range, source, editor) => {
    const { cardId, quillEditor } = this
    const { uiStore } = this.props

    if (!cardId) return

    uiStore.selectTextRangeForCard({
      range,
      quillEditor,
      cardId,
    })
    // also store editor.getContents(range) for later reference
    if (source === 'user') {
      this.sendCursor()
    }
  }

  combineAwaitingDeltas = delta => {
    this.combinedDelta = this.combinedDelta.compose(delta)
    this.bufferDelta = this.bufferDelta.compose(delta)
  }

  _sendCursor = () => {
    if (!this.quillEditor) return
    this.socketSend('cursor', {
      range: this.quillEditor.getSelection(),
    })
  }

  _sendCombinedDelta = () => {
    if (!this.combinedDelta.length() || this.currentlySending) {
      if (this.currentlySending && !this.currentlySendingCheck) {
        this.currentlySendingCheck = setTimeout(() => {
          // if we are stuck 15s in this `currentlySending` mode it means our socketSends are
          // silently failing... we've probably been unsubscribed and it's throwing a backend error
          if (this.currentlySending) {
            this.channelDisconnected('stuck for 15s')
          }
        }, 15 * 1000)
      }
      return false
    }

    this.currentlySending = true
    const full_content = this.contentSnapshot.compose(this.combinedDelta)
    // persist the change locally e.g. when we close the text box
    this.setItemQuillData({ ...full_content })

    // NOTE: will get rejected if this.version < server saved version,
    // in which case the handleReceivedDelta error will try to resend
    this.socketSend('delta', {
      version: this.version,
      delta: this.combinedDelta,
      full_content,
      current_user_id: this.props.currentUserId,
    })
    this.sendCursor()

    // now that we have sent off our data, we can clear out what's in our buffer;
    // our combinedDelta won't clear out until we know it has successfully sent
    this.bufferDelta = new Delta()
    return this.combinedDelta
  }

  socketSend = (method, data) => {
    const channel = ChannelManager.getChannel(
      this.channelName,
      this.props.item.id
    )
    if (!channel) {
      this.channelDisconnected()
      return
    }
    this.channel.perform(method, data)
  }

  handleKeyDown = e => {
    if (e.key === 'Escape') {
      this.cancel()
    }
  }

  handleFocus = e => {
    const { item, uiStore } = this.props
    this.focused = true
    // any time the text editor receives focus...
    // you are effectively "leaving" commenting, should clear out commentingOnRecord
    if (uiStore.commentingOnRecord === item) {
      uiStore.setCommentingOnRecord(null)
    }
  }

  onComment = async e => {
    const { apiStore, item } = this.props
    e.preventDefault()

    apiStore.openCurrentThreadToCommentOn(item)
  }

  get keyBindings() {
    const endOfHighlight = (range, context) => {
      if (!context.format || !context.format.commentHighlight) {
        return false
      }
      const nextFormat = this.quillEditor.getFormat(range.index + 1)
      if (nextFormat && nextFormat.commentHighlight) {
        return false
      }
      return true
    }
    const insertText = (index, char) => {
      this.quillEditor.insertText(
        index,
        char,
        {
          commentHighlight: false,
          'data-comment-id': null,
        },
        'user'
      )
      this.quillEditor.setSelection(index + 1)
    }
    return {
      enter: {
        key: Keyboard.keys.ENTER,
        handler: (range, context) => {
          if (endOfHighlight(range, context)) {
            insertText(range.index, '\n')
          } else {
            // propagate to quill default newline behavior
            return true
          }
        },
      },
      space: {
        key: 32,
        handler: (range, context) => {
          if (endOfHighlight(range, context)) {
            insertText(range.index, ' ')
          } else {
            // propagate to quill default newline behavior
            return true
          }
        },
      },
    }
  }

  render() {
    const { item, onExpand, fullPageView, containerRef } = this.props
    // item is not fully loaded yet, e.g. from a CommentThread
    if (!item.quill_data) return null

    const { canEdit } = this
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleTextChange,
      onChangeSelection: this.handleSelectionChange,
      onFocus: this.handleFocus,
      onBlur: e => {
        this.focused = false
      },
      readOnly: !canEdit,
      modules: {
        customClipboard: true,
        toolbar: canEdit ? '#quill-toolbar' : null,
        cursors: {
          hideDelayMs: 3000,
        },
        keyboard: {
          bindings: this.keyBindings,
        },
      },
    }

    return (
      <StyledContainer
        ref={c => (containerRef ? containerRef(c) : null)}
        className="no-drag"
        fullPageView={fullPageView}
      >
        <DockedToolbar fullPageView={fullPageView}>
          {canEdit && (
            <TextItemToolbar onExpand={onExpand} onComment={this.onComment} />
          )}
          <CloseButton
            data-cy="TextItemClose"
            className="ql-close"
            onClick={this.cancel}
            size={fullPageView ? 'lg' : 'sm'}
          />
        </DockedToolbar>
        <QuillStyleWrapper fullPageView={fullPageView}>
          <ReactQuill
            {...quillProps}
            value={this.quillData}
            onKeyDown={this.handleKeyDown}
          />
        </QuillStyleWrapper>
      </StyledContainer>
    )
  }
}

RealtimeTextItem.displayName = 'RealtimeTextItem'

RealtimeTextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  currentUserId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  fullyLoaded: PropTypes.bool.isRequired,
  onExpand: PropTypes.func,
  fullPageView: PropTypes.bool,
  initialFontTag: PropTypes.oneOf(['H1', 'H3', 'P']),
  containerRef: PropTypes.func,
}
RealtimeTextItem.defaultProps = {
  onExpand: null,
  fullPageView: false,
  initialFontTag: 'P',
  containerRef: null,
}
RealtimeTextItem.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RealtimeTextItem
