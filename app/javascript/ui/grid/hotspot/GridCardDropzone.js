import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'

import { StyledGridCardEmpty } from '~/ui/grid/hotspot/shared'
import DropzoneHolder from '~/ui/grid/hotspot/DropzoneHolder'

@observer
class GridCardDropzone extends React.Component {
  @observable
  willUpload = false

  handleDragOver = e => {
    e.preventDefault()
    this.updateWillUpload(true)
  }

  handleDragLeave = e => {
    if (e.target.closest('.dropzoneEmpty')) {
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
      <StyledGridCardEmpty
        className={'visible dropzoneEmpty'}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
      >
        {this.willUpload && (
          <DropzoneHolder handleAfterUploading={this.resetUpload} />
        )}
      </StyledGridCardEmpty>
    )
  }
}

GridCardDropzone.propTypes = {
  handleAfterUploading: PropTypes.func.isRequired,
}

export default GridCardDropzone
