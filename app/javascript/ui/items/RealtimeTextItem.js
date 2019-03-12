import _ from 'lodash'
import PropTypes from 'prop-types'
import { computed, toJS } from 'mobx'
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

  // initialize from server data?
  version = 0
  lastSentDelta = new Delta()
  combinedDelta = new Delta()

  constructor(props) {
    super(props)
    const { item } = props
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.channel = ChannelManager.subscribe(this.channelName, item.id, {
      channelDisconnected: this.channelDisconnected,
      channelReceivedData: this.channelReceivedData,
    })

    this.sendCombinedDelta = _.debounce(this._sendCombinedDelta, 500)
    this.sendCursor = _.throttle(this._sendCursor, 50)
    // initialize from server data?
    // this.versionMatrix[currentUserId] = {
    //   version: 0,
    //   delta: null,
    // }
  }

  // delta
  //   - send out, with User/Version matrix
  //      - dk-2
  //      - iz-1
  //   ... keep typing, waits to send again until server response to send again
  //   - server comes back with latest text?delta?
  //      - dk-2
  //      - iz-2
  //   - now i say, great, my dk-2 has been received,
  //     - how has my delta been changed... ?
  //     - I can send out dk-3, which is everything else, start the whole thing over again

  componentDidMount() {
    if (!this.reactQuillRef) return
    const { item } = this.props
    this.version = item.realtime_data_content
      ? item.realtime_data_content.version
      : 0

    this.attachQuillRefs()
    // this.applyDiff()
    setTimeout(() => {
      this.setState({ loading: false })
    }, 100)
  }

  componentDidUpdate() {
    this.attachQuillRefs()
    // if (!this.props.fullyLoaded) this.applyDiff()
  }

  componentWillUnmount() {
    ChannelManager.unsubscribeAllFromChannel(this.channelName)
  }

  // applyDiff() {
  //   const { item } = this.props
  //   const remoteContents = new Delta(toJS(item.realtime_data_content.data))
  //   // console.log('remote contents', remoteContents)
  //   const editorContents = new Delta(this.quillEditor.getContents())
  //   // console.log('editor contents', editorContents)
  //   const remoteChanges = editorContents.diff(remoteContents)
  //   // console.log('remote changes', remoteChanges)
  //   if (remoteChanges.ops.length > 0) {
  //     this.quillEditor.updateContents(remoteChanges, 'silent')
  //   }
  // }
  //
  // applyDelta(data) {
  //   // const editorContents = new Delta(tmpl.quillEditor.getContents())
  //   const remoteChanges = data
  //   if (remoteChanges.ops.length > 0) {
  //     // Make updates, to allow cursor to stay put
  //     // this.quillEditor.setContents(remoteChanges, 'silent')
  //     this.props.item.updateRealtimeData(data)
  //   }
  // }

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

  handleReceivedDelta = ({ current_editor, data }) => {
    const remoteDelta = new Delta(data.delta)
    // update our local version number
    if (current_editor.id !== this.props.currentUserId) {
      // apply the incoming other person's delta
      const remoteDeltaWithLocalChanges = this.combinedDelta.transform(
        remoteDelta
      )
      // console.log('UPDATE CONTENTS!!!!')
      this.quillEditor.updateContents(remoteDeltaWithLocalChanges, 'silent')
      // this.props.item.updateRealtimeData(new Delta(data.data))

      if (this.combinedDelta.ops.length) {
        // transform our awaiting content
        this.combinedDelta = remoteDelta.transform(this.combinedDelta, true)
      }
    } else if (this.lastSentDelta) {
      this.version = data.version
      // ???
      // console.log('UPDATE REALTIME')
      this.props.item.updateRealtimeData(
        new Delta(data.data).compose(this.combinedDelta)
      )
    }
    this.sendCursor()
  }

  @computed
  get dataContent() {
    const { item } = this.props
    return toJS(item.realtime_data_content.data)
  }

  cancel = ev => null

  save = () => {
    const { quillEditor } = this
    const content = quillEditor.root.innerHTML
    const dataContent = quillEditor.getContents()
    this.props.onSave(content, dataContent)
  }

  channelDisconnected = () => {
    this.save()
  }

  handleTextChange = (content, delta, source, editor) => {
    if (source === 'user') {
      // if (this.saveTimer) clearTimeout(this.saveTimer)
      // this.saveTimer = setTimeout(() => {
      //   this.save()
      // }, 1000)
      // this.channel.perform('delta', {
      //   content,
      //   delta,
      //   source,
      // })
      // console.log('otClient.applyFromClient', { delta })
      // this.otClient.applyFromClient(delta)

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
    // console.log('combined', delta, this.combinedDelta)
  }

  _sendCursor = () => {
    this.channel.perform('cursor', {
      range: this.quillEditor.getSelection(),
    })
  }

  _sendCombinedDelta = () => {
    if (this.waitingForVersion === this.version) {
      // try again in a little bit
      console.log('WAITING...')
      return setTimeout(this.sendCombinedDelta, 125)
    }
    if (!this.combinedDelta.ops.length) {
      // console.log('NOTHING TO SEND')
      return false
    }

    // this.otClient.applyFromClient(this.combinedDelta)
    this.channel.perform('delta', {
      version: this.version,
      delta: this.combinedDelta,
      current_user_id: this.props.currentUserId,
    })
    this.sendCursor()

    this.waitingForVersion = this.version
    this.lastSentDelta = new Delta(this.combinedDelta)
    this.combinedDelta = new Delta()
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
