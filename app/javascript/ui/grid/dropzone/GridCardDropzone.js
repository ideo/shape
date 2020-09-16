import { observable, action } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'
import PropTypes from 'prop-types'

import googleTagManager from '~/vendor/googleTagManager'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { MAX_SIZE } from '~/utils/FilestackUpload'
import { ITEM_TYPES } from '~/utils/variables'
import DropzoneHolder from '~/ui/grid/dropzone/DropzoneHolder'

const StyledGridCardDropzone = styled.div`
  width: 100%;
  height: 100%;
`
StyledGridCardDropzone.displayName = 'GridCardDropzone'

@inject('uiStore', 'apiStore')
@observer
class GridCardDropzone extends React.Component {
  @observable
  willUpload = false

  @observable
  didUpload = false

  @observable
  placeholderCardIds = []

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

  @action
  updateWillUpload = willUpload => {
    this.willUpload = willUpload
  }

  @action
  updateDidUpload = didUpload => {
    this.didUpload = didUpload
  }

  @action
  setPlaceholderCardIds = ids => {
    this.placeholderCardIds = ids
  }

  resetUpload = () => {
    const { uiStore } = this.props
    uiStore.setDroppingFilesCount(0)
    this.updateWillUpload(false)
    this.updateDidUpload(false)
  }

  handleDrop = async e => {
    e.preventDefault()
    const { dataTransfer } = e
    const { files } = dataTransfer
    const { row, col, collection, apiStore, uiStore } = this.props
    const filesThatFit = _.filter(files, f => f.size < MAX_SIZE)

    if (filesThatFit.length < files.length) {
      this.resetUpload()
      uiStore.popupAlert({
        prompt: `There are
        ${files.length -
          filesThatFit.length} file(s) that were over the ${MAX_SIZE /
          (1024 *
            1024)} MB limit. Please remove them from your selection and try again.
      `,
        fadeOutTime: 6000,
      })
      return
    }

    if (_.isEmpty(files)) return

    const data = {
      row,
      col,
      count: files.length,
      parent_id: collection.id,
    }

    const placeholderCards = await apiStore.createPlaceholderCards({
      data,
    })

    // store placeholder cards to replace with actual file cards
    this.setPlaceholderCardIds(
      _.map(placeholderCards, placeholderCard => placeholderCard.id)
    )

    _.each(placeholderCards, placeholderCard => {
      collection.addCard(placeholderCard)
    })

    this.resetUpload()
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
      await card.API_createFromPlaceholderId(this.placeholderCardIds[idx])

      googleTagManager.push({
        event: 'formSubmission',
        formType: `Create ${ITEM_TYPES.FILE}`,
        parentType: 'foamcore',
      })
    })

    // clear placeholder card ids for next upload
    this.setPlaceholderCardIds([])
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
          handleDrop={this.handleDrop}
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
