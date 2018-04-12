import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import EditorPill from '~/ui/items/EditorPill'

// How long to wait before unlocking editor due to inactivity
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
// typing - change event: save, reset unlock timer
// stop editing - blur event OR unlock timer completes: save, unlock, broadcast

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
    this.broadcastStoppedEditing = false
    this.isEditing = false
    this.numViewers = 0
  }

  state = {
    currentEditor: null,
    locked: false
  }

  componentDidMount() {
    if (!this.reactQuillRef) return
    if (this.canEdit) {
      const { editor } = this.reactQuillRef
      overrideHeadersFromClipboard(editor)
    }
    this.subscribeToItemEditingChannel()
    this.attachQuillRefs()
  }

  componentDidUpdate() {
    this.attachQuillRefs()
  }

  componentWillUnmount() {
    this.channel.unsubscribe()
  }

  attachQuillRefs = () => {
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  get canEdit() {
    return this.props.item.can_edit
  }

  get renderEditorPill() {
    const { locked, currentEditor } = this.state
    const { currentUserId } = this.props
    if (!locked || !currentEditor) return ''
    if (currentEditor.id === currentUserId) return ''
    return <EditorPill className="editor-pill" editor={currentEditor} />
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

  channelReceivedData = (data) => {
    console.log('Channel received data:', data)
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
    if (newCurrentEditor && newCurrentEditor.id === currentUserId) return

    // If editor is present and is not this user, lock editing
    if (newCurrentEditor && newCurrentEditor.id !== currentUserId) {
      locked = true
    } else {
      locked = false
    }

    this.setState({
      currentEditor: newCurrentEditor,
      locked
    })

    // If someone else previously finished editing, fetch updates
    if ((currentEditor && !newCurrentEditor) && (currentEditor.id !== currentUserId)) {
      this.props.handleRefetchItem()
    }
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
    this.broadcastEditingState({ editing: true })
    // Start unlock timer immediately, in case they never type anything
    this.startUnlockTimer()
  }

  broadcastEditingState = ({ editing }) => {
    console.log('Broadcast editing is:', editing)
    const { item } = this.props
    if (editing) {
      this.channel.perform('start_editing', { id: item.id })
    } else {
      this.channel.perform('stop_editing', { id: item.id })
    }
  }

  unlockEditingIfOtherViewers = () => {
    console.log('Check if we should unlock editing')
    // Unlock if there are other viewers (this user is counted as a viewer)
    if (this.numViewers > 1) {
      // Kick user out of editor
      this.ignoreBlurEvent = true
      this.reactQuillRef.blur() // <-- this triggers two unlocks unless event is ignored
      this.ignoreBlurEvent = false
      this.broadcastStoppedEditing = true
      // Cancel any outstanding requests to save
      this.debouncedOnKeyUp.cancel()
      // Call save immediately if there are changes
      this._onKeyUp()
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
    // we have to convert the item to a normal JS object for Quill to be happy
    return item.toJS().text_data
  }

  onKeyUp = () => {
    this.debouncedOnKeyUp()
    this.startUnlockTimer()
  }

  _onKeyUp = () => {
    const { item } = this.props
    const { quillEditor } = this
    item.content = quillEditor.root.innerHTML
    item.text_data = quillEditor.getContents()
    item.save().then(() => {
      if (this.broadcastStoppedEditing) {
        this.broadcastEditingState({ editing: false })
        this.broadcastStoppedEditing = false
      }
    })
  }

  render() {
    const { locked } = this.state
    let quillProps = {}
    if (this.canEdit) {
      quillProps = {
        ...v.quillDefaults,
        ref: c => { this.reactQuillRef = c },
        theme: 'snow',
        onKeyUp: this.onKeyUp,
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
  handleRefetchItem: PropTypes.func.isRequired,
}

export default TextItem
