import { observable, action } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'
import PropTypes from 'prop-types'

import googleTagManager from '~/vendor/googleTagManager'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { ITEM_TYPES } from '~/utils/variables'
import DropzoneHolder from '~/ui/grid/dropzone/DropzoneHolder'

const StyledGridCardDropzone = styled.div`
  width: 100%;
  height: 100%;
`

@inject('uiStore', 'apiStore')
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

  resetUpload = (success = false) => {
    const { uiStore } = this.props
    this.updateWillUpload(false)
    this.updateDidUpload(false)
    if (success) {
      uiStore.setDroppingFiles(false)
    }
  }

  validateFile = e => {
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

  showProgress = () => {
    // if (this.state.loading) return
    // this.setState({ loading: true })
  }

  createCardsForFiles = files => {
    const { collection, height, width, apiStore } = this.props
    let { col, row } = this.props

    _.each(files, async (file, idx) => {
      if (row !== null && col !== null) {
        col += idx % 4
        row += Math.floor(idx / 4)
      }

      const attrs = {
        // FIXME: this assumes that order is the same as index
        order: idx,
        col,
        row,
        width,
        height,
        parent_id: collection.id,
        item_attributes: {
          type: ITEM_TYPES.FILE,
          filestack_file_attributes: {
            url: file.url,
            handle: file.handle,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            docinfo: file.docinfo,
          },
        },
      }
      const card = new CollectionCard(attrs, apiStore)
      card.parent = parent // Assign parent so store can get access to it
      await card.API_create()

      googleTagManager.push({
        event: 'formSubmission',
        formType: `Create ${ITEM_TYPES.FILE}`,
        parentType: 'foamcore',
      })
    })

    this.resetUpload(true)
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
          handleDragLeave={this.resetUpload}
          handleDrop={this.validateFile}
          handleProgress={this.showProgress}
          handleAfterSuccess={this.createCardsForFiles}
          willUpload={this.willUpload}
          didUpload={this.didUpload}
        />
      </StyledGridCardDropzone>
    )
  }
}

GridCardDropzone.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardDropzone.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
}

export default GridCardDropzone
