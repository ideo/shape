import { inject, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import EditorPill from '~/ui/items/EditorPill'

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
    this.onTextChange = _.debounce(this._onTextChange, 1000)
    this.cable = ActionCable.createConsumer('ws://localhost:3000/cable')
    this.channel = undefined
    this.unlockTimeout = undefined
  }

  state = {
    locked: false,
    numViewers: 0,
    editor: null
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

  subscribeToItemEditingChannel = () => {
    console.log('subscribe to editing channel')
    const { item } = this.props
    this.channel = this.cable.subscriptions.create(
      {
        channel: 'ItemEditingChannel',
        id: item.id
      },
      {
        connected: this.connected,
        disconnected: this.disconnected,
        received: this.received,
        rejected: this.rejected,
      }
    )
  }

  received = (data) => {
    console.log('Channel received data', data)
    // If editor is this user, ignore
    const { apiStore } = this.props
    if (data.editor.id === apiStore.currentUserId || _.isEmpty(data.editor)) {
      data.editor = null
    }
    this.setState({
      editor: data.editor,
      numViewers: data.numViewers,
    })
  }

  connected = () => {
    console.log('Channel connected')
  }

  disconnected = () => {
   console.log('Channel disconnected')
  }

  rejected = () => {
   console.log('Channel rejected')
  }

  onBlur = () => {
    this.broadcastIsEditing(false)
  }

  onFocus = () => {
    this.broadcastIsEditing()
  }

  broadcastIsEditing = (editing = true) => {
    console.log('broadcast editing', editing)
    const { item } = this.props
    if (editing) {
      this.channel.perform('start_editing', { id: item.id })
    } else {
      this.channel.perform('stop_editing', { id: item.id })
    }
  }

  allowEditingIfViewers = () => {
    const { numViewers } = this.state
    // TODO: stop user from editing text

    // Broadcast that other viewers can edit,
    // if there are other viewers (this user is counted as a viewer)
    if (numViewers > 1) this.broadcastIsEditing(false)
  }

  // Unlock text box after 5 seconds of inactivity
  userFinishedEditing = () => {
    // Reset the timeout so user has another 5 seconds
    // if they just finished editing
    if (this.unlockTimeout) clearTimeout(this.unlockTimeout)

    this.unlockTimeout = setTimeout(() => {
      this.allowEditingIfViewers()
    }, 10000)
  }

  get canEdit() {
    return this.props.item.can_edit
  }

  _onTextChange = (content, delta, source, editor) => {
    const { item } = this.props
    const textData = editor.getContents()
    item.content = content
    item.text_data = textData
    item.save()
  }

  render() {
    const { item } = this.props
    const { editor } = this.state

    // we have to convert the item to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    let quillProps = {}
    if (this.canEdit) {
      quillProps = {
        ...v.quillDefaults,
        ref: c => { this.quillEditor = c },
        theme: 'snow',
        onChange: this.onTextChange,
        onFocus: this.onFocus,
        onBlur: this.onBlur,
        readOnly: !!editor,
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
        { editor && <EditorPill className="editor-pill" editor={editor} /> }
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
