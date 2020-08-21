import v from '~/utils/variables'
import styled from 'styled-components'
import { observable } from 'mobx'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FilestackUpload from '~/utils/FilestackUpload'

import { DisplayText } from '~/ui/global/styled/typography'
import CloudIcon from '~/ui/icons/CloudIcon'
import IconHolder from '~/ui/icons/IconHolder'

const StyledDropzoneHolder = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${v.colors.primaryLight};

  /* Override Filestack styling */
  .fsp-drop-pane__container {
    height: 100%;
    z-index: ${v.zIndex.gridCardBg + 1};
    /* must be transparent -- dropzone is transparent and content behind it is visible */
    background: ${v.colors.transparent};
    border: none;
    padding: 0px;
  }
`

const StyledIconAndHeadingHolder = styled(IconHolder)`
  width: 30%;
  height: auto;
  position: absolute;
  top: 20%;
  left: 35%;
  color: ${v.colors.secondaryMedium};
  pointer-events: none;
`

@inject('uiStore')
@observer
class DropzoneHolder extends React.Component {
  @observable
  droppingFile = false

  constructor(props) {
    super(props)
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.willUpload && this.props.willUpload) {
      this.createDropPane()
    }
  }

  handleDragOver = e => {}

  handleDragLeave = e => {
    this.props.handleResetUpload({ success: false })
  }

  handleDrop = e => {
    // if (this.state.loading) return
    // const { files } = ev.dataTransfer
    // const filesThatFit = _.filter(files, f => f.size < MAX_SIZE)
    // if (filesThatFit.length) {
    //   this.setState({ loading: true, droppingFile: false })
    // } else {
    //   this.setState({ loading: false, droppingFile: false })
    // }
    // if (filesThatFit.length < files.length) {
    //   uiStore.popupAlert({
    //     prompt: `
    //       ${filesThatFit.length} file(s) were successfully added.
    //       ${files.length -
    //         filesThatFit.length} file(s) were over 25MB and could not
    //       be added.
    //     `,
    //     fadeOutTime: 6000,
    //   })
    // }
  }

  handleProgress = e => {
    // if (this.state.loading) return
    // this.setState({ loading: true })
  }

  handleSuccess = async res => {
    if (res.length > 0) {
      const files = await FilestackUpload.processFiles(res)
      const fileAttrs = []
      _.each(files, (file, idx) => {
        const filestack_file_attributes = {
          url: file.url,
          handle: file.handle,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          docinfo: file.docinfo,
        }
        fileAttrs.push(filestack_file_attributes)
      })

      // create placeholder cards then rerender files
      this.props.handleResetUpload({ success: true })
    }
  }

  createDropPane = () => {
    const uploadOpts = {}

    // CSS selector where the dropzone will be
    const container = 'dropzone'
    const dropPaneOpts = {
      onDragOver: this.handleDragOver,
      onDragLeave: this.handleDragLeave,
      onDrop: this.handleDrop,
      onProgress: this.handleProgress,
      onSuccess: this.handleSuccess,
    }
    FilestackUpload.makeDropPane(container, dropPaneOpts, uploadOpts)
  }

  render() {
    const { willUpload, didUpload } = this.props
    const id = willUpload || didUpload ? 'dropzone' : ''
    return (
      <StyledDropzoneHolder id={id}>
        {(willUpload || didUpload) && (
          <StyledIconAndHeadingHolder display={'inline-block'}>
            <CloudIcon />
            <DisplayText fontSize={'.75em'} textTransform="uppercase">
              Drag & Drop
            </DisplayText>
          </StyledIconAndHeadingHolder>
        )}
      </StyledDropzoneHolder>
    )
  }
}

DropzoneHolder.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

DropzoneHolder.propTypes = {
  handleResetUpload: PropTypes.func.isRequired,
  willUpload: PropTypes.bool.isRequired,
  didUpload: PropTypes.bool.isRequired,
}

export default DropzoneHolder
