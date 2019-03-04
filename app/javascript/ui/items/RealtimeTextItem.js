import PropTypes from 'prop-types'
import Delta from 'quill-delta'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

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

class RealtimeTextItem extends React.Component {
  channelName = 'ItemRealtimeChannel'
  state = { quillData: null, loading: true }
  saveTimer = null

  constructor(props) {
    super(props)
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.state.quillData = props.quillContent
    this.channel = ChannelManager.subscribe(this.channelName, props.itemId, {
      channelDisconnected: this.channelDisconnected,
      channelReceivedData: this.channelReceivedData,
    })
  }

  componentDidMount() {
    if (!this.reactQuillRef) return
    this.attachQuillRefs()
    this.applyDiff()
    setTimeout(() => {
      this.setState({ loading: false })
    }, 100)
  }

  componentDidUpdate() {
    this.attachQuillRefs()
    if (!this.props.fullyLoaded) this.applyDiff()
  }

  componentWillUnmount() {
    ChannelManager.unsubscribeAllFromChannel(this.channelName)
  }

  applyDiff() {
    const remoteContents = new Delta(this.props.quillData)
    // console.log('remote contents', remoteContents)
    const editorContents = new Delta(this.quillEditor.getContents())
    // console.log('editor contents', editorContents)
    const remoteChanges = editorContents.diff(remoteContents)
    // console.log('remote changes', remoteChanges)
    if (remoteChanges.ops.length > 0) {
      this.quillEditor.updateContents(remoteChanges, 'silent')
    }
  }

  applyDelta(delta) {
    // const editorContents = new Delta(tmpl.quillEditor.getContents())
    const remoteChanges = delta
    if (remoteChanges.ops.length > 0) {
      // Make updates, to allow cursor to stay put
      this.quillEditor.updateContents(remoteChanges, 'silent')
    }
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    if (this.quillEditor) return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  channelReceivedData = res => {
    if (res.current_editor.id !== this.props.currentUserId) {
      if (!res.data || !res.data.delta) return
      this.applyDelta(res.data.delta)
    }
  }

  save = () => {
    const { quillEditor } = this
    const content = quillEditor.root.innerHTML
    const dataContent = quillEditor.getContents()
    this.props.onSave(content, dataContent)
  }

  channelDisconnected = () => {
    this.save()
  }

  handleKeyUp = (content, delta, source, editor) => {
    if (source === 'user') {
      if (this.saveTimer) clearTimeout(this.saveTimer)
      this.saveTimer = setTimeout(() => {
        this.save()
      }, 400)
      this.channel.perform('delta', {
        content,
        delta,
        source,
      })
    }
  }

  render() {
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleKeyUp,
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
          <ReactQuill {...quillProps} />
        </QuillStyleWrapper>
      </StyledContainer>
    )
  }
}
RealtimeTextItem.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  itemId: PropTypes.string.isRequired,
  quillContent: PropTypes.node.isRequired,
  canEdit: PropTypes.bool,
  onSave: PropTypes.func,
}
RealtimeTextItem.defaultProps = {
  canEdit: false,
  onSave: () => {},
}

export default RealtimeTextItem
