import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

import { StyledGridCardEmpty } from '~/ui/grid/hotspot/shared'
import DropzoneHolder from '~/ui/grid/hotspot/DropzoneHolder'

const StyledGridCardDropzone = styled.div`
  width: 100%;
  height: 100%;
  background: ${v.colors.primaryLight};
`

@observer
class GridCardDropzone extends React.Component {
  @observable
  willUpload = false

  handleDragOver = e => {
    e.preventDefault()
    if (e.target.closest('.gridCardDropzone')) {
      this.updateWillUpload(true)
    }
  }

  handleDragLeave = e => {
    e.preventDefault()
    if (
      e.target.closest('.dropzoneHolder') ||
      e.target.closest('.fsp-drop-pane__drop-zone')
    ) {
      return
    }
    this.updateWillUpload(false)
  }

  @action
  updateWillUpload = willUpload => {
    this.willUpload = willUpload
  }

  resetUpload = ({ success = false }) => {
    const { handleAfterUploading } = this.props
    handleAfterUploading({ success })
    this.updateWillUpload(false)
  }

  render() {
    return (
      <StyledGridCardDropzone
        className={'gridCardDropzone'}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDragEnd={this.handleDragEnd}
      >
        {!this.willUpload ? (
          <StyledGridCardEmpty className={'visible'} />
        ) : (
          <DropzoneHolder handleResetUpload={this.resetUpload} />
        )}
      </StyledGridCardDropzone>
    )
  }
}

GridCardDropzone.propTypes = {
  handleAfterUploading: PropTypes.func.isRequired,
}

export default GridCardDropzone
