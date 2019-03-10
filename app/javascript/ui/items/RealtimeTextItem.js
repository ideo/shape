import _ from 'lodash'
import PropTypes from 'prop-types'
import { computed, toJS } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Delta from 'quill-delta'
import ReactQuill from 'react-quill'
import styled from 'styled-components'
import ot from 'quill-ot/lib/client'

import ChannelManager from '~/utils/ChannelManager'
import { CloseButton } from '~/ui/global/styled/buttons'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import v from '~/utils/variables'

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
  otClient = null
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

    this.sendDeltas = _.debounce(this._sendDeltas, 100)

    const otVersion = item.realtime_data_content.deltas.length
    // console.log({ otVersion })
    this.otClient = new ot.Client(otVersion || 0)
    this.otClient.applyDelta = delta => {
      // console.log('otClient.applyDelta', { delta })
      this.applyDelta(delta)
    }
    this.otClient.sendDelta = (version, delta) => {
      // console.log('otClient.sendDelta', { version, delta })
      this.channel.perform('delta', {
        version,
        delta,
      })
    }
  }

  componentDidMount() {
    if (!this.reactQuillRef) return
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

  applyDiff() {
    const { item } = this.props
    const remoteContents = new Delta(toJS(item.realtime_data_content.data))
    // console.log('remote contents', remoteContents)
    const editorContents = new Delta(this.quillEditor.getContents())
    // console.log('editor contents', editorContents)
    const remoteChanges = editorContents.diff(remoteContents)
    // console.log('remote changes', remoteChanges)
    if (remoteChanges.ops.length > 0) {
      this.quillEditor.updateContents(remoteChanges, 'silent')
    }
  }

  applyDelta(data) {
    // const editorContents = new Delta(tmpl.quillEditor.getContents())
    const remoteChanges = data
    if (remoteChanges.ops.length > 0) {
      // Make updates, to allow cursor to stay put
      // this.quillEditor.setContents(remoteChanges, 'silent')
      this.props.item.updateRealtimeData(data)
    }
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    if (this.quillEditor) return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  channelReceivedData = res => {
    if (!res.data || !res.data.delta) return
    if (res.current_editor.id !== this.props.currentUserId) {
      // const remoteDelta = new Delta(toJS(res.data.delta))
      // console.log('crd applyFromServer', remoteDelta)
      this.otClient.applyFromServer(res.data.data)
      // update observable value to update ReactQuill
      // console.log('setting', res.data.data)
      // this.quillEditor.setContents(res.data.data, 'silent')
    } else {
      // console.log('crd serverAck')
      this.otClient.serverAck()
    }
    // console.log('THIS.VERSION >>', this.otClient.version)
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

      this.addDelta(delta)
      this.sendDeltas()
    }
  }
  addDelta = delta => {
    this.combinedDelta = this.combinedDelta.compose(delta)
    // console.log('combined', delta, this.combinedDelta)
  }

  _sendDeltas = () => {
    this.otClient.applyFromClient(this.combinedDelta)
    this.combinedDelta = new Delta()
  }

  render() {
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleTextChange,
      readOnly: !this.props.canEdit && !this.state.loading,
      modules: {
        toolbar: '#quill-toolbar',
      },
    }

    return (
      <StyledContainer
        className="no-drag"
        loading={this.state.loading}
        fullPageView
      >
        <DockedToolbar fullPageView>
          {this.props.canEdit && <TextItemToolbar onExpand={() => {}} />}
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
  canEdit: PropTypes.bool,
  onSave: PropTypes.func,
}
RealtimeTextItem.defaultProps = {
  canEdit: false,
  onSave: () => {},
}

export default RealtimeTextItem
