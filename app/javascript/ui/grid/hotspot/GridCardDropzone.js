import { observable, action } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import _ from 'lodash'

import DropzoneHolder from '~/ui/grid/hotspot/DropzoneHolder'

const StyledGridCardDropzone = styled.div`
  width: 100%;
  height: 100%;
  background: ${v.colors.primaryLight};
`

@inject('uiStore')
@observer
class GridCardDropzone extends React.Component {
  @observable
  willUpload = false

  @observable
  didUpload = false

  constructor(props) {
    super(props)
    this.debouncedWillResetUpload = _.debounce(() => {
      this.updateWillUpload(false)
    }, 100)
  }

  handleDragOver = e => {
    e.preventDefault()
    if (e.target.closest('.gridCardDropzone')) {
      this.updateWillUpload(true)
      // reset willUpload to prevent many instances of this class to render DropzoneHolder
      this.debouncedWillResetUpload()
    }
  }

  handleDrop = e => {
    e.preventDefault()
    if (!this.willUpload) {
      this.updateDidUpload(true)
    }
  }

  @action
  updateWillUpload = willUpload => {
    this.willUpload = willUpload
  }

  @action
  updateDidUpload = didUpload => {
    this.didUpload = didUpload
  }

  resetUpload = ({ success = false }) => {
    const { uiStore } = this.props
    this.updateWillUpload(false)
    this.updateDidUpload(false)
    if (success) {
      // TODO: should render placeholder cards here?
      uiStore.setDroppingFiles(false)
    }
  }

  render() {
    return (
      <StyledGridCardDropzone
        className={'gridCardDropzone'}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDragEnd={this.handleDragEnd}
      >
        <DropzoneHolder
          handleResetUpload={this.resetUpload}
          willUpload={this.willUpload}
          didUpload={this.didUpload}
        />
      </StyledGridCardDropzone>
    )
  }
}

GridCardDropzone.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GridCardDropzone
