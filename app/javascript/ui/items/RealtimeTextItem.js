import _ from 'lodash'
import PropTypes from 'prop-types'
import { toJS } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Delta from 'quill-delta'
import ReactQuill, { Quill } from 'react-quill'
import QuillCursors from 'quill-cursors'
import styled from 'styled-components'

import ChannelManager from '~/utils/ChannelManager'
import { CloseButton } from '~/ui/global/styled/buttons'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import { routingStore } from '~/stores'
import v from '~/utils/variables'

Quill.register('modules/cursors', QuillCursors)

const DockedToolbar = styled.div`
  background: white;
  box-sizing: border-box;
  height: 32px;
  left: 0;
  margin-bottom: 20px;
  padding: 5px 10px 0;
  ${props => props.fullPageView && `padding-left: 36px`};
  position: fixed;
  ${props => `top: ${props.fullPageView ? v.headerHeight : 0}px`};
  width: 100%;
  z-index: 100;
  ${props =>
    // Hack because headerHeight doesn't close the gap to-the-pixel
    props.fullPageView &&
    `
    margin-top: -4px;
    @media only screen and (max-width: ${v.responsive.muiSmBreakpoint}px) {
      margin-top: -7px;
    }
  `};
`

const StyledContainer = styled.div`
  padding-top: 25px;

  ${props => props.fullPageView && `padding: 2rem 0.5rem;`};
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
    height: 100%;
    .ql-tooltip.ql-editing,
    .ql-tooltip.ql-flip {
      left: calc(50% - 150px) !important;
      top: -20px !important;
      position: fixed;
      z-index: 10000;
    }
  `} *::selection {
    background: highlight !important;
  }
`

@observer
class RealtimeTextItem extends React.Component {
  channelName = 'ItemRealtimeChannel'
  state = { disconnected: false }
  saveTimer = null
  version = null
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
    this.subscribeToItemEditingChannel()
    setTimeout(() => {
      this.subscribeToItemEditingChannel()
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
    const { routingTo } = routingStore
    const { item } = this.props
    const routingToSameItem =
      routingTo.id === item.id && routingTo.type === 'items'
    ChannelManager.unsubscribeAllFromChannel(this.channelName, {
      keepOpen: routingToSameItem,
    })
  }

  subscribeToItemEditingChannel() {
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
    const { item } = this.props
    this.version = item.data_content.version || 0
    this.contentSnapshot = this.quillEditor.getContents()
  }

  createCursor({ id, name }) {
    const cursors = this.quillEditor.getModule('cursors')
    cursors.createCursor(id, name, v.colors.tertiaryMedium)
  }

  channelConnected = () => {
    if (this.unmounted) return
    this.setState({ disconnected: false })
  }

  channelDisconnected = () => {
    if (this.unmounted) return
    // TODO: do anything here? try to reconnect?
    console.warn('Disconnected from channel')
    const { fullPageView } = this.props
    if (!fullPageView) {
      // this will cancel you out of the editor back to view-only mode
      this.cancel()
      return
    }
    // this will likewise put you into readOnly mode on the ItemPage
    this.setState({ disconnected: true })
  }

  channelReceivedData = ({ current_editor, data, num_viewers }) => {
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
    const { currentUserId } = this.props

    // update our local version number
    if (data.version) {
      if (!data.error && data.last_10) {
        const diff = data.version - this.version
        if (diff > 0) {
          _.each(data.last_10, previous => {
            const delta = new Delta(previous.delta)
            if (previous.version > this.version) {
              if (previous.editor_id !== currentUserId) {
                this.applyIncomingDelta(delta)
              }
              // update for later sending appropriately composed version to be saved
              this.contentSnapshot = this.contentSnapshot.compose(delta)
              this.version = previous.version
            }
          })
        }
      }
      // this.version = data.version
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
      this.bufferDelta = new Delta()
      if (this.combinedDelta.length()) {
        // if we had some waiting content
        this.sendCombinedDelta()
      }
    }
    this.sendCursor()
  }

  applyIncomingDelta(remoteDelta) {
    // apply the incoming other person's delta, accounting for our own changes,
    // but prioritizing theirs
    const remoteDeltaWithLocalChanges = this.combinedDelta.transform(
      remoteDelta
    )
    // make sure our local editor is up to date with changes.
    this.quillEditor.updateContents(remoteDeltaWithLocalChanges, 'silent')
    // persist local changes
    this.setItemDataContent()

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

  get dataContent() {
    const { item } = this.props
    return toJS(item.data_content)
  }

  cancel = ev => {
    const { onCancel } = this.props
    // NOTE: in non-fullPageView cancel also means "save current text"!
    if (!this.canEdit) return onCancel(this.props.item, ev)
    const item = this.setItemDataContent()
    return onCancel(item, ev)
  }

  setItemDataContent() {
    const { item } = this.props
    const { quillEditor } = this
    item.content = quillEditor.root.innerHTML
    item.data_content = {
      ...quillEditor.getContents(),
      version: this.version,
    }
    return item
  }

  handleTextChange = (content, delta, source, editor) => {
    if (source === 'user') {
      const cursors = this.quillEditor.getModule('cursors')
      cursors.clearCursors()

      this.combineAwaitingDeltas(delta)
      this.sendCombinedDelta()
    }
  }

  handleSelectionChange = (range, source, editor) => {
    if (source === 'user') {
      this.sendCursor()
    }
  }

  handleBlur = (range, source, editor) => {
    const { fullPageView } = this.props
    // Check if something is being linked, which causes a blur event
    const linker = this.quillEditor.container.querySelector(
      '.ql-tooltip:not(.ql-hidden)'
    )
    if (linker) {
      // if the linker is open then we don't want to trigger blur/cancel
      return
    }
    if (!fullPageView) {
      setTimeout(() => {
        const selection = editor.getSelection()
        if (!selection) {
          // we actually did blur, and not copy/paste which can also trigger onBlur
          this.cancel()
        }
      }, 100)
    }
  }

  combineAwaitingDeltas = delta => {
    this.combinedDelta = this.combinedDelta.compose(delta)
    this.bufferDelta = this.bufferDelta.compose(delta)
  }

  _sendCursor = () => {
    this.socketSend('cursor', {
      range: this.quillEditor.getSelection(),
    })
  }

  _sendCombinedDelta = () => {
    if (!this.combinedDelta.length() || this.currentlySending) {
      if (this.currentlySending && !this.currentlySendingCheck) {
        this.currentlySendingCheck = setTimeout(() => {
          // if we are stuck 10s in this `currentlySending` mode it means our socketSends are
          // silently failing... we've probably been unsubscribed and it's throwing a backend error
          if (this.currentlySending) this.channelDisconnected()
        }, 10 * 1000)
      }
      return false
    }

    this.currentlySending = true
    const full_content = this.contentSnapshot.compose(this.combinedDelta)
    // NOTE: will get rejected if this.version < server saved version,
    // in which case the handleReceivedDelta error will try to resend
    this.socketSend('delta', {
      version: this.version,
      delta: this.combinedDelta,
      full_content,
      current_user_id: this.props.currentUserId,
    })
    this.sendCursor()

    // persist the change locally e.g. when we close the text box
    this.props.item.data_content = {
      ...full_content,
      version: this.version,
    }

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

  render() {
    const { onExpand, fullPageView } = this.props
    const { canEdit } = this
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleTextChange,
      onChangeSelection: this.handleSelectionChange,
      onBlur: this.handleBlur,
      readOnly: !canEdit,
      modules: {
        toolbar: canEdit ? '#quill-toolbar' : null,
        cursors: {
          hideDelayMs: 3000,
        },
      },
    }

    return (
      <StyledContainer className="no-drag" fullPageView={fullPageView}>
        <DockedToolbar fullPageView={fullPageView}>
          {canEdit && <TextItemToolbar onExpand={onExpand} />}
          <CloseButton
            data-cy="TextItemClose"
            onClick={this.cancel}
            size={fullPageView ? 'lg' : 'sm'}
          />
        </DockedToolbar>
        <QuillStyleWrapper>
          <ReactQuill {...quillProps} value={this.dataContent} />
        </QuillStyleWrapper>
      </StyledContainer>
    )
  }
}

RealtimeTextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  currentUserId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  fullyLoaded: PropTypes.bool.isRequired,
  onExpand: PropTypes.func,
  fullPageView: PropTypes.bool,
}
RealtimeTextItem.defaultProps = {
  onExpand: null,
  fullPageView: false,
}

export default RealtimeTextItem
