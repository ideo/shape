import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import { CloseButton } from '~/ui/global/styled/buttons'
import EditorPill from '~/ui/items/EditorPill'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import ChannelManager from '~/utils/ChannelManager'

// How long to wait before unlocking editor due to inactivity
// Only used if there are other viewers
const UNLOCK_IN_MILLISECONDS = 5000

const StyledContainer = styled.div`
  ${props => props.fullPageView && `padding: 2rem 0.5rem;`} padding-top: 25px;
  .editor-pill {
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

const remapHeaderToH3 = (node, delta) => {
  delta.map(op => (op.attributes.header = 3))
  return delta
}

export const overrideHeadersFromClipboard = editor => {
  // change all non-H3 header attributes to H3, e.g. when copy/pasting
  editor.clipboard.addMatcher('H1', remapHeaderToH3)
  editor.clipboard.addMatcher('H2', remapHeaderToH3)
  editor.clipboard.addMatcher('H4', remapHeaderToH3)
  editor.clipboard.addMatcher('H5', remapHeaderToH3)
  editor.clipboard.addMatcher('H6', remapHeaderToH3)
}

// Real-time event handling:

// EDITOR
// start editing - focus event: broadcast, start unlock timer
// typing - keyUp event: save, reset unlock timer
// stop editing - blur event OR unlock timer completes: unlock, save, broadcast

// VIEWER
// receive editor present event: lock text box
// receive no editor present event: unlock text box

class TextItem extends React.Component {
  channelName = 'ItemEditingChannel'

  constructor(props) {
    super(props)
    this.debouncedOnKeyUp = _.debounce(this._onKeyUp, 2000)
    this.channel = undefined
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.unlockTimeout = undefined
    this.ignoreBlurEvent = false
    this.broadcastStoppedEditingAfterSave = false
    this.leaving = false
    this.cancelKeyUp = false
    this.isEditing = false
    this.numViewers = 0
    this.readyToSave = false
    this.linkerInterval = null
  }

  state = {
    currentEditor: null,
    locked: false,
  }

  componentDidMount() {
    if (this.canEdit) {
      if (!this.reactQuillRef) return
      const { editor } = this.reactQuillRef
      overrideHeadersFromClipboard(editor)
      this.attachQuillRefs()
      if (!this.props.fullPageView) this.startEditing()
    }
    this.subscribeToItemEditingChannel()
    setTimeout(() => {
      const { currentEditor } = this.state
      const { currentUserId } = this.props
      if (currentEditor && currentEditor.id !== currentUserId) return
      if (!this.canEdit) return
      this.quillEditor.focus()
    }, 350)
  }

  componentDidUpdate() {
    this.attachQuillRefs()
  }

  componentWillUnmount() {
    const { item, onSave } = this.props
    if (this.unlockTimeout) clearTimeout(this.unlockTimeout)
    this.leaving = true
    if (!this.canEdit) return
    this.debouncedOnKeyUp.flush()
    ChannelManager.unsubscribeAllFromChannel(this.channelName)
    if (this.linkerInterval) clearInterval(this.linkerInterval)
    if (this.readyToSave) {
      onSave(item)
    }
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  subscribeToItemEditingChannel = () => {
    const { item } = this.props
    this.channel = ChannelManager.subscribe(this.channelName, item.id, {
      channelDisconnected: this.channelDisconnected,
      channelReceivedData: this.channelReceivedData,
    })
  }

  channelReceivedData = async data => {
    const { currentUserId } = this.props
    const { currentEditor } = this.state
    let { locked } = this.state
    let broadcastEditor = data.current_editor

    // Store this internally, not forcing a re-render if user is editing
    // As it only affects internal state about whether to unlock
    this.numViewers = data.num_viewers

    if (this.numViewers === 0) return

    // Set null if it is an empty object
    if (_.isEmpty(broadcastEditor)) broadcastEditor = null

    // if no broadcast editor == somebody just finished
    // if currentEditor is not me, that means it's somebody else that just finished
    if (
      !broadcastEditor &&
      (!currentEditor || currentEditor.id !== currentUserId)
    ) {
      this.cancelKeyUp = true
      this.props.onUpdatedData(data.item_text_data)
      this.cancelKeyUp = false
    }

    if (broadcastEditor && broadcastEditor.id !== currentUserId) {
      locked = true
    } else {
      locked = false
      // don't keep setting the state if you're editing
      if (
        !locked &&
        broadcastEditor &&
        currentEditor &&
        broadcastEditor.id === currentEditor.id
      ) {
        return
      }
    }

    this.setState({
      currentEditor: broadcastEditor,
      locked,
    })
  }

  channelDisconnected = () => {
    // When disconnected, unlock editor if it was locked
    const { locked } = this.state
    if (locked) {
      this.setState({
        locked: false,
      })
    }
  }

  onEditorBlur = (range, source, editor) => {
    const { fullPageView, onCancel } = this.props
    // Check if something is being linked, which causes a blur event
    const linker = this.quillEditor.container.querySelector(
      '.ql-tooltip:not(.ql-hidden)'
    )
    if (linker) {
      // we need to determine if the linker has gone from visible to hidden
      // at that point we perform the same onCancel as for the onBlur
      this.linkerInterval = setInterval(() => {
        const linkerHidden = linker.classList.contains('ql-hidden')
        if (linkerHidden && !fullPageView) {
          clearInterval(this.linkerInterval)
          if (!this.quillEditor.hasFocus()) {
            const item = this.getCurrentText()
            onCancel(item)
          }
        }
      }, 200)
      return
    }
    // If they click outside of editor, release the lock immediately
    if (!this.ignoreBlurEvent) {
      this.unlockEditingIfOtherViewers()
    }
    if (!fullPageView) {
      const item = this.getCurrentText()
      if (!item.id) {
        onCancel(item)
        return
      }
      setTimeout(() => {
        const selection = editor.getSelection()
        if (selection) {
          // we just pasted... so blur + refocus to stay within the editor
          this.quillEditor.blur()
          this.quillEditor.focus()
        } else {
          // otherwise we actually did blur
          onCancel(item)
        }
      }, 100)
    }
  }

  onEditorFocus = () => {
    const { locked } = this.state
    // Ignore any events while editor is locked
    if (locked) return
    this.startEditing()
  }

  cancel = ev => {
    const { onCancel } = this.props
    if (!this.canEdit) return onCancel(this.props.item, ev)
    const item = this.getCurrentText()
    return onCancel(item, ev)
  }

  getCurrentText() {
    const { item } = this.props
    const { quillEditor } = this
    item.content = quillEditor.root.innerHTML
    item.text_data = quillEditor.getContents()
    return item
  }

  startEditing = () => {
    const { currentUserId } = this.props
    const { currentEditor } = this.state
    // no need to broadcast if we're already marked as the editor
    if (currentEditor && currentEditor.id === currentUserId) return
    // console.log('startEditing....')
    this.broadcastEditingState({ editing: true })
    // Start unlock timer immediately, in case they never type anything
    this.startUnlockTimer()
    this.setState({
      currentEditor: { id: currentUserId },
      locked: false,
    })
  }

  broadcastEditingState = ({ editing }) => {
    // console.log('Broadcast editing is:', editing)
    if (!this.channel) return
    const { item } = this.props
    if (editing) {
      this.channel.perform('start_editing', {
        id: item.id,
        data: this.textData,
      })
    } else {
      this.channel.perform('stop_editing', { id: item.id, data: this.textData })
    }
  }

  handleTab = () => {
    this.quillEditor.blur()
  }

  unlockEditingIfOtherViewers = () => {
    if (this.unlockTimeout) clearTimeout(this.unlockTimeout)
    if (this.numViewers > 1) {
      // Kick user out of editor
      this.ignoreBlurEvent = true
      this.reactQuillRef.blur() // <-- this triggers two unlocks unless event is ignored
      this.ignoreBlurEvent = false
      this.broadcastStoppedEditingAfterSave = true
      // Cancel any outstanding requests to save
      this.debouncedOnKeyUp.cancel()
      // NOTE: there may not be any debounced keyups waiting, so always immediately call _onKeyUp
      this._onKeyUp()
    }
  }

  startUnlockTimer = () => {
    // Reset the timeout if it is running, to extend the unlock
    if (this.unlockTimeout) clearTimeout(this.unlockTimeout)

    this.unlockTimeout = setTimeout(() => {
      this.unlockEditingIfOtherViewers()
    }, UNLOCK_IN_MILLISECONDS)
  }

  get textData() {
    const { item } = this.props
    return item.toJSON().text_data
  }

  onKeyUp = (content, delta, source, editor) => {
    if (this.cancelKeyUp) return
    const { currentUserId } = this.props
    const { currentEditor } = this.state
    if (currentEditor && currentEditor.id !== currentUserId) return
    this.startEditing()
    this.debouncedOnKeyUp(content, delta, source, editor)
    this.startUnlockTimer()
  }

  _onKeyUp = async (content, delta, source, editor) => {
    const { item, onSave, fullPageView } = this.props
    const { quillEditor } = this
    item.content = quillEditor.root.innerHTML
    item.text_data = quillEditor.getContents()
    if (fullPageView) {
      await onSave(item, { cancel_sync: !this.leaving })
    } else {
      this.readyToSave = true
      if (this.quillEditor.hasFocus()) return
    }
    if (this.broadcastStoppedEditingAfterSave) {
      this.broadcastEditingState({ editing: false })
      this.broadcastStoppedEditingAfterSave = false
    }
  }

  get canEdit() {
    return this.props.item.can_edit_content
  }

  get renderEditorPill() {
    const { currentEditor } = this.state
    const { currentUserId } = this.props
    if (!currentEditor || currentEditor.id === currentUserId) return ''
    return <EditorPill className="editor-pill" editor={currentEditor} />
  }

  render() {
    const { fullPageView, onExpand } = this.props
    const { locked } = this.state
    let quillProps = {}
    if (this.canEdit) {
      quillProps = {
        ...v.quillDefaults,
        ref: c => {
          this.reactQuillRef = c
        },
        theme: 'snow',
        onChange: this.onKeyUp,
        onFocus: this.onEditorFocus,
        onBlur: this.onEditorBlur,
        readOnly: locked,
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
      <StyledContainer className="no-drag" fullPageView={fullPageView}>
        {this.canEdit && (
          <TextItemToolbar fullPageView={fullPageView} onExpand={onExpand} />
        )}
        <CloseButton
          onClick={this.cancel}
          size={fullPageView ? 'lg' : 'sm'}
          position={fullPageView ? 'absolute' : 'fixed'}
        />
        {this.renderEditorPill}
        <ReactQuill {...quillProps} value={this.textData} />
      </StyledContainer>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  actionCableConsumer: MobxPropTypes.objectOrObservableObject.isRequired,
  currentUserId: PropTypes.string.isRequired,
  onUpdatedData: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  fullPageView: PropTypes.bool,
  onExpand: PropTypes.func,
}
TextItem.defaultProps = {
  fullPageView: false,
  onExpand: null,
  onCancel: () => {},
}

export default TextItem
