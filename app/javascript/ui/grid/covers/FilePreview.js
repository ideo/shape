import PropTypes from 'prop-types'
import { when } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'

import FilestackUpload from '~/utils/FilestackUpload'
import Modal from '~/ui/global/modals/Modal'
import { uiStore } from '~/stores'

const PreviewContainer = styled.div`
  height: ${props => props.height}px;
  width: ${props => props.width}px;
`

@observer
class FilePreview extends React.Component {
  componentDidMount() {
    when(
      () => uiStore.previewingFile,
      () => {
        //FilestackUpload.preview(uiStore.previewingFile, 'filePreview')
      }
    )
  }

  componentDidUpdate() {
    if (uiStore.previewingFile) {
      setTimeout(() => {
        FilestackUpload.preview(uiStore.previewingFile, 'filePreview')
      }, 50)
    }
  }

  handleClose = (ev) => {
    uiStore.closePreview()
  }

  render() {
    return (
      <Modal
        title=""
        onClose={this.handleClose}
        open={!!uiStore.previewingFile}
        noStyling
      >
        <PreviewContainer width={1000} height={600} id="filePreview" />
      </Modal>
    )
  }
}

export default FilePreview
