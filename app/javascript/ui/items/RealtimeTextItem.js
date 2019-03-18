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
  state = { loading: true }
  saveTimer = null
  version = 0
  combinedDelta = new Delta()
  bufferDelta = new Delta()
  contentSnapshot = new Delta()

  constructor(props) {
    super(props)
    const { item } = props
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.channel = ChannelManager.subscribe(this.channelName, item.id, {
      channelDisconnected: this.channelDisconnected,
      channelReceivedData: this.channelReceivedData,
    })

    this.sendCombinedDelta = _.debounce(this._sendCombinedDelta, 200)
    this.sendCursor = _.throttle(this._sendCursor, 100)
  }

  componentDidMount() {
    if (!this.reactQuillRef) return
    const { item } = this.props
    this.version = item.data_content.version || 0
    this.contentSnapshot = new Delta(item.data_content)

    this.attachQuillRefs()
    setTimeout(() => {
      this.setState({ loading: false })
    }, 100)

    window.fake = text => this.receiveFakeData(text)
  }

  componentDidUpdate() {
    this.attachQuillRefs()
  }

  componentWillUnmount() {
    ChannelManager.unsubscribeAllFromChannel(this.channelName)
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    if (this.quillEditor) return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  createCursor({ id, name }) {
    const cursors = this.quillEditor.getModule('cursors')
    cursors.createCursor(id, name, v.colors.tertiaryMedium)
  }

  channelReceivedData = ({ current_editor, data, num_viewers }) => {
    // console.log({ current_editor, data, num_viewers })
    if (data && data.delta) {
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

  receiveFakeData = (text = 'Abc') => {
    const current_editor = { id: 99 }
    const data = {
      delta: { ops: [{ insert: text }] },
    }
    this.handleReceivedDelta({ current_editor, data })
  }

  handleReceivedDelta = ({ current_editor, data }) => {
    const remoteDelta = new Delta(data.delta)

    if (data.error) {
      if (current_editor.id === this.props.currentUserId) {
        // try again
        this.sendCombinedDelta()
      }
      return
    }

    // update our local version number
    if (data.version) {
      this.version = data.version
    }

    // update for later sending appropriately composed version to be saved
    this.contentSnapshot = this.contentSnapshot.compose(remoteDelta)

    if (current_editor.id !== this.props.currentUserId) {
      // apply the incoming other person's delta, accounting for our own changes,
      // but prioritizing theirs
      const remoteDeltaWithLocalChanges = this.combinedDelta.transform(
        remoteDelta
      )
      this.quillEditor.updateContents(remoteDeltaWithLocalChanges, 'silent')

      if (this.combinedDelta.length()) {
        // transform our awaiting content, prioritizing the remote delta
        this.combinedDelta = remoteDelta.transform(this.combinedDelta, true)
      }
    } else if (current_editor.id === this.props.currentUserId) {
      // clear out our combinedDelta
      this.combinedDelta = this.bufferDelta.slice()
      this.bufferDelta = new Delta()
    }
    this.sendCursor()
  }

  get dataContent() {
    const { item } = this.props
    return toJS(item.data_content)
  }

  cancel = ev => null

  channelDisconnected = () => {
    this._sendCombinedDelta()
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

  combineAwaitingDeltas = delta => {
    this.combinedDelta = this.combinedDelta.compose(delta)
    this.bufferDelta = this.bufferDelta.compose(delta)
  }

  _sendCursor = () => {
    this.channel.perform('cursor', {
      range: this.quillEditor.getSelection(),
    })
  }

  _sendCombinedDelta = () => {
    if (!this.combinedDelta.ops.length) {
      return false
    }
    if (this.waitingForVersion === this.version) {
      // try again in a little bit
      return setTimeout(this.sendCombinedDelta, 125)
    }

    // const contents = this.quillEditor.getContents()
    this.channel.perform('delta', {
      version: this.version,
      delta: this.combinedDelta,
      full_content: this.contentSnapshot.compose(this.combinedDelta),
      current_user_id: this.props.currentUserId,
    })
    this.sendCursor()

    this.waitingForVersion = this.version
    // this.lastSentDelta = new Delta(this.combinedDelta)
    this.bufferDelta = new Delta()
    return this.combinedDelta
  }

  render() {
    const { item } = this.props
    const canEdit = item.can_edit_content
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleTextChange,
      onChangeSelection: this.handleSelectionChange,
      readOnly: !canEdit && !this.state.loading,
      modules: {
        toolbar: canEdit ? '#quill-toolbar' : null,
        cursors: {
          hideDelayMs: 3000,
        },
      },
    }

    // console.log('rander')

    return (
      <StyledContainer
        className="no-drag"
        loading={this.state.loading}
        fullPageView
      >
        <DockedToolbar fullPageView>
          {canEdit && <TextItemToolbar onExpand={() => {}} />}
          <CloseButton
            data-cy="TextItemClose"
            onClick={this.cancel}
            size={'lg'}
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
  currentUserId: PropTypes.string.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  quillContent: PropTypes.node.isRequired,
  onSave: PropTypes.func,
}
RealtimeTextItem.defaultProps = {
  onSave: () => {},
}

export default RealtimeTextItem
