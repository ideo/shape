import { inject, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import EditorPill from '~/ui/items/EditorPill'

// How long to wait before unlocking editor due to inactivity
const UNLOCK_WAIT_MILLISECONDS = 3000

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

@inject('apiStore')
class TextItem extends React.Component {
  constructor(props) {
    super(props)
    this.debouncedOnTextChange = _.debounce(this._debouncedOnTextChange, 1000)
    this.cable = ActionCable.createConsumer('ws://localhost:3000/cable')
    this.channel = undefined
    this.unlockTimeout = undefined
  }

  state = {
    numViewers: 0,
    currentEditor: null,
    locked: false
  }

  componentDidMount() {
    if (!this.quillEditor) return
    if (this.canEdit) {
      const { editor } = this.quillEditor
      overrideHeadersFromClipboard(editor)
    }
    this.subscribeToItemEditingChannel()
  }

  componentWillUnmount() {
    this.channel.unsubscribe()
  }

  get canEdit() {
    return this.props.item.can_edit
  }

  get renderEditorPill() {
    const { locked, currentEditor } = this.state
    const { apiStore } = this.props
    if (!locked || !currentEditor) return ''
    if (currentEditor.id === apiStore.currentUserId) return ''
    return <EditorPill className="editor-pill" editor={currentEditor} />
  }

  subscribeToItemEditingChannel = () => {
    const { item } = this.props
    this.channel = this.cable.subscriptions.create(
      {
        channel: 'ItemEditingChannel',
        id: item.id
      },
      {
        connected: this.channelConnected,
        disconnected: this.channelDisconnected,
        received: this.channelReceivedData,
        rejected: this.channelRejected,
      }
    )
  }

  channelReceivedData = (data) => {
    console.log('Channel received data:', data)
    const { item, apiStore } = this.props
    const { currentEditor } = this.state
    const numViewers = data.num_viewers
    let newCurrentEditor = data.current_editor
    let locked

    // Set null if it is an empty object
    if (_.isEmpty(newCurrentEditor)) newCurrentEditor = null

    // If editor is present and is not this user, lock editing
    if (newCurrentEditor && newCurrentEditor.id !== apiStore.currentUserId) {
      locked = true
    } else {
      locked = false
    }
    this.setState({
      currentEditor: newCurrentEditor,
      numViewers,
      locked
    })
    // If someone previously finished editing, fetch updates
    if (currentEditor && !newCurrentEditor) {
      apiStore.fetch('items', item.id, { force: true })
    }
  }

  channelConnected = () => {
    // console.log('Channel connected')
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

  channelRejected = () => {
    // console.log('Channel rejected')
  }

  onEditorBlur = () => {
    this.startUnlockTimer(true)
  }

  onEditorFocus = () => {
    this.broadcastIsEditing()
    this.startUnlockTimer()
  }

  broadcastIsEditing = (editing = true) => {
    console.log('Broadcast editing is:', editing)
    const { item } = this.props
    if (editing) {
      this.channel.perform('start_editing', { id: item.id })
    } else {
      // Call save / debounced flush
      this.debouncedOnTextChange.flush()
      this.channel.perform('stop_editing', { id: item.id })
    }
  }

  unlockEditingIfOtherViewers = () => {
    console.log('Check if we should unlock editing')
    const { numViewers } = this.state
    // Unlock if there are other viewers (this user is counted as a viewer)
    if (numViewers > 1) {
      // Kick user out of editor
      this.quillEditor.blur()
      // Broadcast that other viewers can edit
      this.broadcastIsEditing(false)
    }
  }

  startUnlockTimer = (unlockImmediately) => {
    // Reset the timeout so user has another 3 seconds
    // if they just finished editing
    if (this.unlockTimeout) clearTimeout(this.unlockTimeout)

    if (unlockImmediately) {
      this.unlockEditingIfOtherViewers()
    } else {
      this.unlockTimeout = setTimeout(() => {
        this.unlockEditingIfOtherViewers()
      }, UNLOCK_WAIT_MILLISECONDS)
    }
  }

  onTextChange = (content, delta, source, quill) => {
    this.debouncedOnTextChange(content, delta, source, quill)
    this.startUnlockTimer()
  }

  _debouncedOnTextChange = (content, delta, source, quill) => {
    const { item } = this.props
    const textData = quill.getContents()
    item.content = content
    item.text_data = textData
    item.save()
  }

  render() {
    const { item } = this.props
    const { locked } = this.state

    // we have to convert the item to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    let quillProps = {}
    if (this.canEdit) {
      quillProps = {
        ...v.quillDefaults,
        ref: c => { this.quillEditor = c },
        theme: 'snow',
        onChange: this.onTextChange,
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
          value={textData}
        />
      </StyledContainer>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

TextItem.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TextItem
