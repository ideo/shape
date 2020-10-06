import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import {
  calculateOpenSpotMatrix,
  findClosestOpenSpot,
} from '~/utils/CollectionGridCalculator'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { ROW_ACTIONS } from '~/stores/jsonApi/Collection'
import RowActions from './RowActions'
import PositionedBlankCard from '~/ui/grid/interactionLayer/PositionedBlankCard'
import FoamcoreHotEdge from '~/ui/grid/FoamcoreHotEdge'
import FilestackUpload, { MAX_SIZE } from '~/utils/FilestackUpload'
import v, { FOAMCORE_INTERACTION_LAYER, ITEM_TYPES } from '~/utils/variables'
import googleTagManager from '~/vendor/googleTagManager'

const DragLayerWrapper = styled.div`
  height: 100%;
  width: 100%;
  z-index: ${v.zIndex.gridCardTop};

  /* Override Filestack styling */
  .fsp-drop-pane__container {
    height: 100%;
    z-index: ${v.zIndex.gridCardBg + 1};
    /* must be transparent -- dropzone is transparent and content behind it is visible */
    background: ${v.colors.transparent};
    border: none;
    padding: 0px;
    visibility: ${props => (props.droppingFiles ? 'visible' : 'hidden')};
  }

  .fsp-drop-pane__text {
    display: none;
  }
`
@inject('apiStore', 'uiStore')
@observer
class FoamcoreInteractionLayer extends React.Component {
  @observable
  hoveringRowCol = {
    row: null,
    col: null,
  }
  @observable
  touchSwiping = false
  @observable
  touchClickEv = null
  @observable
  placeholderCards = []
  @observable
  creatingHotEdge = false
  @observable
  fileDropProgress = null
  @observable
  loadingCell = null

  componentDidMount() {
    this.createDropPane()
  }

  createDropPane = () => {
    const uploadOpts = {}

    // CSS selector where the dropzone will be
    const container = FOAMCORE_INTERACTION_LAYER
    const dropPaneOpts = {
      onDragLeave: this.handleDragLeave,
      onDrop: this.handleDrop,
      onProgress: this.handleDropStart,
      onSuccess: this.handleSuccess,
    }
    FilestackUpload.makeDropPane(container, dropPaneOpts, uploadOpts)
  }

  handleDropStart = progress => {
    runInAction(() => (this.fileDropProgress = progress))
  }

  handleDrop = async e => {
    e.preventDefault()
    const { dataTransfer } = e
    const { files } = dataTransfer
    const { row, col } = this.hoveringRowCol
    const { collection, apiStore, uiStore } = this.props
    const filesThatFit = _.filter(files, f => f.size < MAX_SIZE)

    if (filesThatFit.length < files.length) {
      uiStore.setDroppingFilesCount(0)
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

    const { blankContentToolState } = uiStore
    const { replacingId } = blankContentToolState
    let placeholderCards = []
    let count = files.length
    if (replacingId) {
      count -= 1
      placeholderCards.push({
        id: replacingId,
        row: blankContentToolState.row,
        col: blankContentToolState.col,
      })
    }

    if (count) {
      const data = {
        row,
        col,
        count,
        parent_id: collection.id,
      }
      const newPlaceholderCards = await apiStore.createPlaceholderCards({
        data,
      })
      placeholderCards = placeholderCards.concat(newPlaceholderCards)
    }

    _.each(placeholderCards, placeholderCard => {
      // track placeholder cards that were created in order to create primary cards once filestack succeeds
      this.addPlaceholderCard({
        id: placeholderCard.id,
        row: placeholderCard.row,
        col: placeholderCard.col,
      })

      // add placeholders to the collection cards store
      collection.addCard(placeholderCard)
    })

    uiStore.setDroppingFilesCount(0)
    runInAction(() => (this.fileDropProgress = null))
  }

  handleSuccess = async res => {
    if (res.length > 0) {
      const files = await FilestackUpload.processFiles(res)
      this.createCardsForFiles(files)
    }
  }

  createCardsForFiles = files => {
    const { collection, apiStore, uiStore } = this.props

    _.each(files, async (file, idx) => {
      // get row and col from placeholders
      const placeholder = this.placeholderCards[idx]

      const attrs = {
        order: idx,
        col: placeholder.col,
        row: placeholder.row,
        width: placeholder.width,
        height: placeholder.height,
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
      await card.API_createFromPlaceholderId(placeholder.id)

      googleTagManager.push({
        event: 'formSubmission',
        formType: `Create ${ITEM_TYPES.FILE}`,
        parentType: 'foamcore',
      })
    })

    // clear placeholder card ids for next upload
    this.clearPlaceholderCards()
    uiStore.closeBlankContentTool()
  }

  createTemplateInstance = async ({ col, row, templateId }) => {
    runInAction(() => {
      this.resetHoveringRowCol()
      this.loadingCell = { col, row }
    })
    const { apiStore, collection } = this.props
    const data = {
      parent_id: collection.id,
      template_id: templateId,
      placement: { col, row },
    }
    const res = await apiStore.createTemplateInstance({
      data,
      template: { name: 'do this', collection_type: 'do this' },
    })
    const { parent_collection_card } = res.data
    const cardRes = await apiStore.fetch(
      'collection_cards',
      parent_collection_card.id,
      true
    )
    collection.addCard(cardRes.data)
    runInAction(() => {
      this.loadingCell = null
    })
  }

  @action
  resetHoveringRowCol() {
    this.hoveringRowCol = { row: null, col: null }
  }

  @action
  addPlaceholderCard = card => {
    if (!card) return
    this.placeholderCards.push(card)
  }

  @action
  clearPlaceholderCards = () => {
    this.placeholderCards = []
  }

  handleTouchStart = ev => {
    if (ev.target.id !== FOAMCORE_INTERACTION_LAYER) {
      return false
    }
    runInAction(() => {
      this.touchSwiping = false
      this.touchClickEv = ev.touches[0]
    })
  }

  handleTouchMove = ev => {
    runInAction(() => {
      this.touchSwiping = true
      this.touchClickEv = null
    })
  }

  onCursorMove = type => ev => {
    const { hasSelectedArea } = this
    if (hasSelectedArea) {
      // ignore these interactions when you're already dragging a selection square
      return
    }

    const childOfInteractionLayer = !!ev.target.closest(
      `.${FOAMCORE_INTERACTION_LAYER}`
    )
    const childOfCardMenu = !!ev.target.closest('.card-menu')
    if (
      (ev.target.id !== FOAMCORE_INTERACTION_LAYER &&
        !childOfInteractionLayer) ||
      childOfCardMenu
    ) {
      return false
    }
    // For some reason, a mouse move event is being published after a touch click
    if (this.touchClickEv && type === 'mouse') return
    const { coordinatesForPosition, uiStore } = this.props
    let rect = { left: 0, top: 0 }
    const container = document.querySelector(`.${FOAMCORE_INTERACTION_LAYER}`)
    if (container) {
      // just a guard for jest shallow render
      rect = container.getBoundingClientRect()
    }

    let { clientX, clientY, target } = ev
    // TouchEnd doesn't give you a clientX, have to get it from start event
    if (type === 'touch') {
      if (this.touchSwiping) return
      const { touchClickEv } = this
      clientX = touchClickEv.clientX
      clientY = touchClickEv.clientY
      target = touchClickEv.target
    }

    const { classList } = target
    if (
      (!classList || !_.includes(classList, FOAMCORE_INTERACTION_LAYER)) &&
      !childOfInteractionLayer
    ) {
      // only perform calculation if target is the grid itself
      return
    }

    const coords = coordinatesForPosition({
      x: clientX - rect.left,
      y: clientY - rect.top,
    })

    const { cardMatrix } = this.props.collection
    const { row, col } = coords

    ev.preventDefault()
    ev.stopPropagation()
    const { blankContentToolState } = uiStore
    // If there's a card already there don't render a positioned blank card
    const cardOrBctOpenAtThisSpot =
      (cardMatrix[row] && cardMatrix[row][col]) ||
      (blankContentToolState.row === row && blankContentToolState.col === col)
    if (cardOrBctOpenAtThisSpot) {
      this.resetHoveringRowCol()
    } else {
      this.repositionBlankCard({ row, col })
      if (uiStore.isMobileXs) {
        this.scrollToBlank(clientY)
      }
    }
  }

  onCreateBct = async ({ row, col, hotcell = false }, contentType, opts) => {
    const { apiStore, uiStore, collection } = this.props

    if (contentType === 'useTemplate') {
      this.createTemplateInstance({
        ...opts,
        row,
        col,
      })
      return
    }

    // If we're already in the process of creating a hot edge and placeholder
    // don't create another one.
    if (hotcell && this.creatingHotEdge) return

    // If opening one from a hot edge make sure to not allow opening them again
    // until again.
    if (hotcell) {
      runInAction(() => (this.creatingHotEdge = true))
    }

    // BCT is already open as a hotcell, just modify it. But don't do this
    // if you're opening a new hotcell.
    if (uiStore.blankContentToolState.blankType === 'hotcell' && !hotcell) {
      runInAction(() => {
        uiStore.blankContentToolState = {
          ...uiStore.blankContentToolState,
          blankType: contentType,
        }
      })
      return
    }

    uiStore.openBlankContentTool({
      row,
      col,
      collectionId: collection.id,
      blankType: hotcell ? 'hotcell' : contentType,
    })
    if (!uiStore.isTouchDevice) {
      runInAction(() => {
        this.resetHoveringRowCol()
        this.touchSwiping = false
        this.touchClickEv = null
      })
    }

    this.resetHoveringRowCol()
    if (hotcell) {
      const placeholder = new CollectionCard(
        {
          row,
          col,
          parent_id: collection.id,
        },
        apiStore
      )
      await placeholder.API_createBct()
      uiStore.setBctPlaceholderCard(placeholder)
      runInAction(() => (this.creatingHotEdge = false))
    }
  }

  onCloseHtc = () => {
    this.resetHoveringRowCol()
  }

  handleInsertRowClick = (ev, row) => {
    return this.onRowClick(ev, row, ROW_ACTIONS.INSERT)
  }

  handleRemoveRowClick = (ev, row) => {
    return this.onRowClick(ev, row, ROW_ACTIONS.REMOVE)
  }

  onRowClick = async (ev, row, action) => {
    ev.stopPropagation()
    const { collection, uiStore } = this.props
    if (uiStore.isTransparentLoading) {
      return false
    }
    collection.API_manipulateRow({ row, action })
    this.resetHoveringRowCol()
  }

  scrollToBlank(clientY) {
    const { relativeZoomLevel } = this.props
    const viewPortH = window.innerHeight
    const mobileMenuH = 200
    if (viewPortH - mobileMenuH < clientY) {
      const scrollAmount = (clientY - mobileMenuH) / relativeZoomLevel
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  positionBlank = (
    { row, col, width, height },
    interactionType = 'drag',
    showDropzoneIcon = false
  ) => {
    let emptyRow = false
    if (interactionType === 'hover') {
      const {
        collection: { collection_cards },
      } = this.props

      emptyRow =
        !_.some(collection_cards, { row }) &&
        !_.some(collection_cards, { row: row - 1, height: 2 })
    }

    return this.renderBlankCard(
      { row, col, width, height, emptyRow },
      interactionType,
      showDropzoneIcon
    )
  }

  @action
  repositionBlankCard = ({ row, col }) => {
    const prevRow = this.hoveringRowCol.row
    const prevCol = this.hoveringRowCol.col
    if (row === prevRow && col === prevCol) {
      return
    }
    this.hoveringRowCol = { row, col }
  }

  renderBlankCard = (
    { row, col, width, height, emptyRow = false },
    interactionType,
    showDropzoneIcon
  ) => {
    const {
      uiStore,
      collection,
      hasDragCollision,
      relativeZoomLevel,
    } = this.props
    const position = uiStore.positionForCoordinates({ col, row, width, height })
    const {
      blankContentToolState: { replacingId },
    } = uiStore

    // could be drag or drag-overflow
    const isDrag = _.includes(interactionType, 'drag')

    return (
      <PositionedBlankCard
        collection={collection}
        position={position}
        interactionType={interactionType}
        showDropzoneIcon={showDropzoneIcon}
        key={`blank-${interactionType}-${row}:${col}`}
        row={row}
        col={col}
        emptyRow={emptyRow}
        replacingId={replacingId}
        /* Why is this rendering on top of a collection? */
        blocked={hasDragCollision && isDrag}
        data-blank-type={interactionType}
        // this is to make it work the same as CollectionGrid BCT for cypress
        className={`StyledHotspot-${row}:${col}-BCT`}
        handleBlankCardClick={this.onCreateBct}
        handleInsertRowClick={this.handleInsertRowClick}
        handleRemoveRowClick={this.handleRemoveRowClick}
        fileDropProgress={this.fileDropProgress}
        onCloseHtc={this.onCloseHtc}
        zoomLevel={relativeZoomLevel}
        data-empty-space-click
      />
    )
  }

  get renderRightBlankActions() {
    const {
      collection,
      collection: { collection_cards, isFourWideBoard },
    } = this.props
    const { row } = this.hoveringRowCol
    if (!_.isNumber(row)) return null
    const emptyRow =
      !_.some(collection_cards, { row }) &&
      !_.some(collection_cards, { row: row - 1, height: 2 })

    if (!emptyRow) return null
    if (!isFourWideBoard) return null

    let card
    if (collection.cardMatrix[row]) {
      card = collection.cardMatrix[row][0]
    }

    return (
      <RowActions
        row={row}
        height={card ? card.height : 1}
        onInsertRow={this.handleInsertRowClick}
        onRemoveRow={this.handleRemoveRowClick}
      />
    )
  }

  get renderDragSpots() {
    const { hoveringOverCollection, uiStore } = this.props
    const { dragGridSpot, movingCardsOverflow } = uiStore

    if (!dragGridSpot.size || hoveringOverCollection) {
      return null
    }

    const draggingPlaceholders = [...dragGridSpot.values()]

    const maxRowCard = _.maxBy(draggingPlaceholders, 'row')
    const maxRow = maxRowCard && maxRowCard.row
    const dragSpots = _.map(draggingPlaceholders, placeholder => {
      placeholder.id = 'drag'
      const atMaxRow =
        placeholder.row === maxRow ||
        placeholder.row + placeholder.height - 1 === maxRow
      if (movingCardsOverflow && atMaxRow) {
        placeholder.id = 'drag-overflow'
      }
      return this.positionBlank(placeholder, placeholder.id)
    })

    return dragSpots
  }

  get renderHoveringSpot() {
    const { uiStore } = this.props
    const { blankContentToolState } = uiStore
    const { row, col } = this.hoveringRowCol

    if (
      row !== null &&
      col !== null &&
      (blankContentToolState.row !== row || blankContentToolState.col !== col)
    ) {
      return this.positionBlank(
        {
          id: 'hover',
          row,
          col,
          width: 1,
          height: 1,
        },
        'hover'
      )
    }
  }

  get renderResizeSpot() {
    const { uiStore } = this.props
    const { placeholderSpot } = uiStore
    const { row, col, width, height } = placeholderSpot

    if (row !== null && col !== null) {
      return this.positionBlank(
        {
          id: 'resize',
          row,
          col,
          width,
          height,
        },
        'resize'
      )
    }
  }

  cardWithinViewPlusPage = card => {
    const { uiStore } = this.props
    // Select all cards that are within view,
    // plus half a screen on any side
    const rows = uiStore.visibleRows
    const cols = uiStore.visibleCols

    const numRows = Math.ceil(rows.num)
    const numCols = Math.ceil(cols.num)

    const withinCols =
      card.col > cols.min - numCols && card.col < cols.max + numCols
    const withinRows =
      card.row > rows.min - numRows && card.row < rows.max + numRows

    return withinRows && withinCols
  }

  get renderDropSpots() {
    const blankCards = []
    const { uiStore } = this.props
    const { droppingFilesCount } = uiStore
    const { row, col } = this.hoveringRowCol

    const takenSpots = []

    const positions = []

    for (let i = 0; i < droppingFilesCount; i++) {
      const openSpot = this.calculateOpenSpot(takenSpots)

      if (openSpot) {
        const showDropzoneIcon = openSpot.row === row && openSpot.col === col
        const position = {
          row: openSpot.row,
          col: openSpot.col,
          width: 1,
          height: 1,
        }
        positions.push(position)
        blankCards.push(this.positionBlank(position, 'hover', showDropzoneIcon))
        takenSpots.push(position)
      }
    }

    return blankCards
  }

  calculateOpenSpot = takenSpots => {
    const { collection, uiStore } = this.props
    const { row, col } = this.hoveringRowCol

    if (!row && !col) return null

    // NOTE: Collection::cardMatrix only returns cards until the collection cards max row
    const openSpotMatrix = calculateOpenSpotMatrix({
      collection,
      takenSpots,
      maxVisibleRow: uiStore.visibleRows && Math.floor(uiStore.visibleRows.max),
    })

    const closestOpenSpot = findClosestOpenSpot(
      {
        row,
        col,
        width: 1,
        height: 1,
      },
      openSpotMatrix,
      collection.num_columns
    )

    return closestOpenSpot
  }

  get droppingFiles() {
    const { uiStore } = this.props
    const { droppingFilesCount } = uiStore
    return droppingFilesCount > 0
  }

  get renderInnerDragLayer() {
    const { dragging, resizing } = this.props

    if (dragging && !resizing && !this.droppingFiles) {
      return this.renderDragSpots
    } else if (resizing && !this.droppingFiles) {
      return this.renderResizeSpot
    } else if (this.droppingFiles) {
      return this.renderDropSpots
    }

    return this.renderHoveringSpot
  }

  get renderHotEdges() {
    const { collection, relativeZoomLevel, maxRow } = this.props
    const {
      cardMatrix,
      collection_cards,
      num_columns,
      isFourWideBoard,
    } = collection

    // rows start at 0, plus add an extra at the bottom
    const newMaxRow = maxRow + 1
    const pinnedCardMaxRow = (
      _.maxBy(_.filter(collection_cards, 'isPinnedAndLocked'), 'row') || {
        row: -1,
      }
    ).row
    const hotEdges = []
    _.each(_.range(0, newMaxRow), row => {
      _.each(_.range(0, num_columns), col => {
        if (!cardMatrix[row] || !cardMatrix[row][col]) {
          // continue iteration
          return true
        }
        // find two cards together UNLESS the card on the right isPinnedAndLocked
        const twoCardsTogether =
          col > 0 &&
          !cardMatrix[row][col].isPinnedAndLocked &&
          cardMatrix[row][col - 1] &&
          cardMatrix[row][col - 1] !== cardMatrix[row][col]
        if (col === 0 || twoCardsTogether) {
          hotEdges.push(
            <FoamcoreHotEdge
              key={`hotspot-${row}:${col}`}
              relativeZoomLevel={relativeZoomLevel}
              row={row}
              col={col}
              horizontal={false}
              onClick={() => {
                this.onCreateBct({ col, row, hotcell: true })
              }}
            />
          )
        }
      })
      if (isFourWideBoard && pinnedCardMaxRow <= row) {
        // only 4WFC has horizontal hot edges in the row gutters
        hotEdges.push(
          <FoamcoreHotEdge
            key={`hotspot-${row}`}
            relativeZoomLevel={relativeZoomLevel}
            row={row}
            onClick={ev => this.handleInsertRowClick(ev, row)}
            horizontal
          />
        )
      }
    })

    return <div>{hotEdges}</div>
  }

  get hasSelectedArea() {
    const { minX, maxX } = this.props.uiStore.selectedArea
    return minX && maxX && maxX > minX
  }

  get renderBct() {
    const { uiStore, collection } = this.props
    const { blankContentToolIsOpen, blankContentToolState } = uiStore
    const { collectionId } = blankContentToolState

    // NOTE: ensure that the bct is open in the same collection
    if (blankContentToolIsOpen && collectionId === collection.id) {
      const interactionType =
        blankContentToolState.blankType === 'hotcell' ? 'hotcell' : 'bct'
      return this.positionBlank({ ...blankContentToolState }, interactionType)
    }

    return null
  }

  get renderLoading() {
    return this.positionBlank({ ...this.loadingCell }, 'unrendered')
  }

  render() {
    const { resizing, uiStore } = this.props

    if (resizing) {
      return this.renderInnerDragLayer
    }
    return (
      <DragLayerWrapper
        id={FOAMCORE_INTERACTION_LAYER}
        data-empty-space-click
        className={FOAMCORE_INTERACTION_LAYER}
        onMouseMove={this.onCursorMove('mouse')}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.onCursorMove('touch')}
        onDragOver={e => {
          e.preventDefault()
          this.onCursorMove('mouse')(e)
          const numItems = _.get(e, 'dataTransfer.items.length', 0)
          uiStore.setDroppingFilesCount(numItems)
        }}
        onDragLeave={e => {
          e.preventDefault()
          if (
            !!(
              e.target.getAttribute &&
              e.target.getAttribute('data-empty-space-click')
            ) ||
            e.target.closest('.gridCardDropzone')
          ) {
            return
          }
          uiStore.setDroppingFilesCount(0)
        }}
        onMouseLeave={e => {
          e.preventDefault()
          this.resetHoveringRowCol()
          uiStore.setDroppingFilesCount(0)
        }}
        droppingFiles={this.droppingFiles}
      >
        {this.renderInnerDragLayer}
        {this.renderHotEdges}
        {this.renderBct}
        {this.renderLoading}
        {this.renderRightBlankActions}
      </DragLayerWrapper>
    )
  }
}

FoamcoreInteractionLayer.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  coordinatesForPosition: PropTypes.func.isRequired,
  hoveringOverCollection: PropTypes.bool.isRequired,
  dragging: PropTypes.bool.isRequired,
  resizing: PropTypes.bool.isRequired,
  hasDragCollision: PropTypes.bool.isRequired,
  relativeZoomLevel: PropTypes.number.isRequired,
  maxRow: PropTypes.number.isRequired,
}

FoamcoreInteractionLayer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default FoamcoreInteractionLayer
