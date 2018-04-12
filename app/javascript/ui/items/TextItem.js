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
    this.debouncedOnTextChange = _.debounce(this._debouncedOnTextChange, 1000)
    this.debouncedStartUnlockTimer = _.debounce(this._startUnlockTimer, 1000)
    this.channel = undefined
    this.unlockTimeout = undefined
    this.ignoreBlurEvent = false
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
    const { currentUserId } = this.props
    if (!locked || !currentEditor) return ''
    if (currentEditor.id === currentUserId) return ''
    return <EditorPill className="editor-pill" editor={currentEditor} />
  }

  componentWillReceiveProps(nextProps) {
    console.log('next props', nextProps)
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
    const { item, currentUserId } = this.props
    const { currentEditor } = this.state
    const numViewers = data.num_viewers
    let newCurrentEditor = data.current_editor
    let locked

    // Set null if it is an empty object
    if (_.isEmpty(newCurrentEditor)) newCurrentEditor = null

    // If editor is present and is not this user, lock editing
    if (newCurrentEditor && newCurrentEditor.id !== currentUserId) {
      locked = true
    } else {
      locked = false
    }
    this.setState({
      currentEditor: newCurrentEditor,
      numViewers,
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
      this.debouncedStartUnlockTimer.flush()
      this._startUnlockTimer(true)
    }
  }

  onEditorFocus = () => {
    this.broadcastEditingState({ editing: true })
    // Start unlock timer, in case they never type anything
    this.debouncedStartUnlockTimer()
  }

  broadcastEditingState = ({ editing }) => {
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
      this.ignoreBlurEvent = true
      // Kick user out of editor
      this.quillEditor.blur() // <-- this is triggering two unlocks
      this.ignoreBlurEvent = false
      // Broadcast that other viewers can edit
      this.broadcastEditingState({ editing: false })
    }
  }

  _startUnlockTimer = (unlockImmediately) => {
    const { locked } = this.state
    // On text change gets called when text is updated from other editor
    // So return if we're not locked
    if (!locked) return
    // Reset the timeout so user has another 3 seconds
    // if they just finished editing
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

  onTextChange = (content, delta, source, quill) => {
    console.log('on text change')
    this.debouncedOnTextChange(content, delta, source, quill)
    this.debouncedStartUnlockTimer()
  }

  _debouncedOnTextChange = (content, delta, source, quill) => {
    const { item } = this.props
    const textData = quill.getContents()
    item.content = content
    item.text_data = textData
    console.log('saved item')
    item.save()
  }

  render() {
    const { locked } = this.state
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
  actionCableConsumer: MobxPropTypes.objectOrObservableObject.isRequired,
  currentUserId: PropTypes.number.isRequired,
  handleRefetchItem: PropTypes.func.isRequired,
}

export default TextItem
