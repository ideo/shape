import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import EditorPill from '~/ui/items/EditorPill'

// How long to wait before unlocking editor due to inactivity
// Only used if there are other viewers
const UNLOCK_IN_MILLISECONDS = 3000

const StyledContainer = styled.div`
  padding: 2rem 0.5rem;
  .editor-pill {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
`

const remapHeaderToH3 = (node, delta) => {
  delta.map((op) => (op.attributes.header = 3))
  return delta
}

export const overrideHeadersFromClipboard = (editor) => {
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
  constructor(props) {
    super(props)
    this.debouncedOnKeyUp = _.debounce(this._onKeyUp, 2000)
    this.channel = undefined
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.unlockTimeout = undefined
    this.ignoreBlurEvent = false
    this.broadcastStoppedEditingAfterSave = false
    this.isEditing = false
    this.numViewers = 0
  }

  state = {
    currentEditor: null,
    locked: false
  }

  componentDidMount() {
    if (this.canEdit) {
      if (!this.reactQuillRef) return
      const { editor } = this.reactQuillRef
      overrideHeadersFromClipboard(editor)
      this.attachQuillRefs()
    }
    this.subscribeToItemEditingChannel()
  }

  componentDidUpdate() {
    this.attachQuillRefs()
  }

  componentWillUnmount() {
    this.channel.unsubscribe()
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  subscribeToItemEditingChannel = () => {
    const { item, actionCableConsumer } = this.props
    this.channel = actionCableConsumer.subscriptions.create(
      {
        channel: 'ItemEditingChannel',
        id: item.id
      },
      {
        connected: () => {},
        disconnected: this.channelDisconnected,
        received: this.channelReceivedData,
        rejected: () => {},
      }
    )
  }

  channelReceivedData = async (data) => {
    // console.log('channelReceivedData', data)
    const { currentUserId } = this.props
    const { currentEditor } = this.state
    let { locked } = this.state
    let newCurrentEditor = data.current_editor

    // Store this internally, not forcing a re-render if user is editing
    // As it only affects internal state about whether to unlock
    this.numViewers = data.num_viewers

    // Set null if it is an empty object
    if (_.isEmpty(newCurrentEditor)) newCurrentEditor = null

    // Return if this is the user that is currently editing,
    // as setting state led to many bugs when the text contents hadn't been saved yet
    if (newCurrentEditor && currentEditor && newCurrentEditor.id === currentEditor.id) return

    // If editor is present and is not this user, lock editing
    if (newCurrentEditor && newCurrentEditor.id !== currentUserId) {
      locked = true
    } else {
      locked = false
    }

    // If someone else previously finished editing, fetch updates
    if ((currentEditor && !newCurrentEditor) && (currentEditor.id !== currentUserId)) {
      this.props.onUpdatedData(data.item_text_data)
    }
    this.setState({
      currentEditor: newCurrentEditor,
      locked
    })
  }

  channelDisconnected = () => {
    // When disconnected, unlock editor if it was locked
    const { locked } = this.state
    if (locked) {
      this.setState({
        locked: false
      })
    }
  }

  onEditorBlur = () => {
    // If they click outside of editor, release the lock immediately
    if (!this.ignoreBlurEvent) {
      this.startUnlockTimer(true)
    }
  }

  onEditorFocus = () => {
    const { locked } = this.state
    // Ignore any events while editor is locked
    if (locked) return
    this.startEditing()
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
  }

  broadcastEditingState = ({ editing }) => {
    // console.log('Broadcast editing is:', editing)
    const { item } = this.props
    if (editing) {
      this.channel.perform('start_editing', { id: item.id, data: this.textData })
    } else {
      this.channel.perform('stop_editing', { id: item.id, data: this.textData })
    }
  }

  unlockEditingIfOtherViewers = () => {
    if (this.numViewers > 1) {
      // Kick user out of editor
      this.ignoreBlurEvent = true
      this.reactQuillRef.blur() // <-- this triggers two unlocks unless event is ignored
      this.ignoreBlurEvent = false
      // this.broadcastStoppedEditingAfterSave = true
      // Cancel any outstanding requests to save
      this.debouncedOnKeyUp.flush()

      this.broadcastEditingState({ editing: false })
      // Call save immediately if there are changes
      // this._onKeyUp()
    }
  }

  startUnlockTimer = (unlockImmediately) => {
    // Reset the timeout if it is running, to extend the unlock
    if (this.unlockTimeout) clearTimeout(this.unlockTimeout)

    if (unlockImmediately) {
      this.unlockEditingIfOtherViewers()
    } else {
      this.unlockTimeout = setTimeout(() => {
        this.unlockEditingIfOtherViewers()
      }, UNLOCK_IN_MILLISECONDS)
    }
  }

  get textData() {
    const { item } = this.props
    return item.toJS().text_data
  }

  onKeyUp = (content, delta, source, editor) => {
    const { currentUserId } = this.props
    const { currentEditor } = this.state
    if (currentEditor && currentEditor.id !== currentUserId) return
    this.startEditing()
    this.debouncedOnKeyUp(content, delta, source, editor)
    this.startUnlockTimer()
  }

  _onKeyUp = (content, delta, source, editor) => {
    const { item, onSave } = this.props
    const { quillEditor } = this
    item.content = quillEditor.root.innerHTML
    item.text_data = quillEditor.getContents()

    onSave(item)
  }

  get canEdit() {
    return this.props.item.can_edit
  }

  get renderEditorPill() {
    const { currentEditor } = this.state
    const { currentUserId } = this.props
    if (!currentEditor || currentEditor.id === currentUserId) return ''
    return <EditorPill className="editor-pill" editor={currentEditor} />
  }

  render() {
    const { locked } = this.state
    let quillProps = {}
    if (this.canEdit) {
      quillProps = {
        ...v.quillDefaults,
        ref: c => { this.reactQuillRef = c },
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
      <StyledContainer>
        { this.canEdit && <TextItemToolbar /> }
        {this.renderEditorPill}
        <ReactQuill
          {...quillProps}
          value={this.textData}
        />
      </StyledContainer>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  actionCableConsumer: MobxPropTypes.objectOrObservableObject.isRequired,
  currentUserId: PropTypes.number.isRequired,
  onUpdatedData: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default TextItem
