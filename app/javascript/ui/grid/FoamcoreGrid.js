import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CardMoveService from '~/utils/CardMoveService'
import {
  calculateOpenSpotMatrix,
  calculateRowsCols,
  findClosestOpenSpot,
  findTopLeftCard,
} from '~/utils/CollectionGridCalculator'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import FoamcoreZoomControls from '~/ui/grid/FoamcoreZoomControls'
import FoamcoreInteractionLayer from '~/ui/grid/interactionLayer/FoamcoreInteractionLayer'
import v, { FOAMCORE_GRID_BOUNDARY } from '~/utils/variables'
import { objectsEqual } from '~/utils/objectUtils'

// set as a flag in case we ever want to enable this, it just makes a couple minor differences in logic
const USE_COLLISION_DETECTION_ON_DRAG = false

const Grid = styled.div`
  position: relative;
  width: ${props => `${props.width}px`};
  height: ${props => `${props.height}px`};
`

function getMapKey({ col, row }) {
  return `${col},${row}`
}

const MAX_CARD_W = 4
const MAX_CARD_H = 2

// needs to be an observer to observe changes to the collection + items
@inject('apiStore', 'uiStore')
@observer
class FoamcoreGrid extends React.Component {
  gridRef = null
  @observable
  cardsToRender = []
  @observable
  dragging = false
  @observable
  resizing = false
  @observable
  // track which row # we are in the process of loading from API
  loadingRow = null
  @observable
  disableHorizontalScroll = false
  @observable
  uploading = false
  @observable
  draggingCardMasterPosition = {}
  draggingMap = []
  // track whether drag movement is blocked because of overlapping cards
  @observable
  hasDragCollision = false
  hoveringOver = false
  dragTimeoutId = null
  openSpotMatrix = []
  movingFromNormalCollection = false
  masterCard = null
  movingCards = []

  constructor(props) {
    super(props)
    this.debouncedSetDraggedOnSpots = _.debounce(this.setDraggedOnSpots, 15)
    this.throttledSetResizeSpot = _.throttle(this.setResizeSpot, 25)
    this.throttledLoadAfterScroll = _.debounce(this.loadAfterScroll, 250)
  }

  componentDidMount() {
    const { collection, uiStore } = this.props

    uiStore.update('selectedAreaEnabled', true)
    uiStore.determineZoomLevels(collection)
    this.updateCollectionScrollBottom()
    this.loadAfterScroll()
    if (collection.isSplitLevelBottom) {
      collection.calculateRowsCols()
    }
    window.addEventListener('scroll', this.handleScroll)
  }

  componentDidUpdate(prevProps) {
    const { collection, uiStore } = this.props
    if (collection.id !== prevProps.collection.id) {
      uiStore.determineZoomLevels(collection)
    }

    if (!objectsEqual(this.props.cardProperties, prevProps.cardProperties)) {
      // e.g. if API_fetchCards has reset the loaded cards, we may want to
      // trigger this in case we are viewing further down the page
      this.throttledLoadAfterScroll()
      if (collection.isSplitLevelBottom) {
        collection.calculateRowsCols()
      }
    }
  }

  componentWillUnmount() {
    this.clearDragTimeout()
    const { uiStore } = this.props
    runInAction(() => {
      uiStore.selectedAreaEnabled = false
    })
    window.removeEventListener('scroll', this.handleScroll)
  }

  get zoomLevel() {
    if (!this.showZoomControls) {
      // force this at 1
      return 1
    }
    return this.props.uiStore.zoomLevel
  }

  get maxRow() {
    // get the max of what's currently visible
    const { collection_cards } = this.props.collection
    return (_.maxBy(collection_cards, 'row') || { row: 0 }).row
  }

  // Load more cards if we are approaching a boundary of what we have loaded
  loadAfterScroll = async () => {
    const { collection, uiStore } = this.props
    // return if we're still loading a new page
    if (this.loadingRow || collection.loadedRows === 0) {
      return
    }

    const { zoomLevel } = this
    this.computeVisibleRows()
    this.computeVisibleCols()

    if (!this.showZoomControls && zoomLevel > 1) {
      this.handleZoomIn()
    }

    const visRows = uiStore.visibleRows

    if (!visRows) return

    // Attempt to load more rows if currently loaded rows is less than
    // one full screen out of view
    const willLoadMoreRows = collection.loadedRows < visRows.max + visRows.num
    if (willLoadMoreRows) {
      this.loadMoreRows()
    }
  }

  loadMoreRows = () => {
    const { collection, uiStore } = this.props
    const { loadMoreCollectionCards } = this
    if (collection.isSplitLevelBottom) {
      if (collection.hasMore) {
        loadMoreCollectionCards({ page: collection.nextPage })
      }
      return
    }

    const visRows = uiStore.visibleRows
    const collectionMaxRow = collection.max_row_index
    // min row should start with the next row after what's loaded
    const loadMinRow = collection.loadedRows + 1
    // add a buffer of 3 more rows (constrained by max row on collection)
    const loadMaxRow = _.min([
      collectionMaxRow,
      Math.ceil(loadMinRow + visRows.num + 3),
    ])
    // min and max could be equal if there is one more row to load
    if (loadMinRow <= loadMaxRow) {
      return loadMoreCollectionCards({
        // just load by row # downward, and always load all 16 cols
        rows: [loadMinRow, loadMaxRow],
      })
    }
  }

  loadMoreCollectionCards = async (opts = {}) => {
    const { maxRow } = this
    const { loadCollectionCards } = this.props
    runInAction(() => {
      this.loadingRow = maxRow
    })
    await loadCollectionCards(opts)
    runInAction(() => {
      this.loadingRow = null
    })
  }

  get pageMargins() {
    const { collection, uiStore } = this.props
    return uiStore.pageMargins(collection)
  }

  // relativeZoomLevel is either the actual zoom level (if not all the way zoomed out),
  // or else returns the precise zoom ratio that will fit all cards on the screen
  get relativeZoomLevel() {
    const { uiStore } = this.props
    return uiStore.relativeZoomLevel
  }

  get showZoomControls() {
    const { uiStore } = this.props
    return uiStore.zoomLevels.length > 1
  }

  get gridSettings() {
    // Foamcore doesn't change gridSettings based on browser size,
    // instead always refer to the defaults
    return v.defaultGridSettings
  }

  // one reason for this, is split level collections need to allocate height for the top half
  get totalGridSize() {
    const { gridW, gridH, gutter } = this.gridSettings
    const { relativeZoomLevel } = this
    const { collection, uiStore } = this.props
    const maxCols = uiStore.maxCols(collection)
    // Max rows is the max row of any current cards (max_row_index)
    // + 1, since it is zero-indexed,
    const visRows = _.get(uiStore, 'visibleRows.num', 1)
    let maxRows = collection.max_row_index + 1
    if (collection.isSplitLevelBottom) {
      maxRows += 1
    } else if (!collection.isSplitLevel) {
      // + 2x the visible number of rows
      // for padding to allow scrolling beyond the current cards
      maxRows += visRows * 2
      if (collection.canEdit) {
        maxRows += 1
      }
    }
    const height = ((gridH + gutter) * maxRows) / relativeZoomLevel
    const width = ((gridW + gutter) * maxCols) / relativeZoomLevel
    return {
      width,
      height,
    }
  }

  get cardAndGutterWidth() {
    const { gridW, gutter } = this.gridSettings
    return (gridW + gutter) / this.relativeZoomLevel
  }

  get cardAndGutterHeight() {
    const { gridH, gutter } = this.gridSettings
    return (gridH + gutter) / this.relativeZoomLevel
  }

  computeVisibleRows() {
    const { pageMargins } = this
    const { uiStore } = this.props

    if (!this.gridRef) return { min: null, max: null }

    const top = window.pageYOffset
    const gridHeight = window.innerHeight - pageMargins.top

    const min = parseFloat((top / this.cardAndGutterHeight).toFixed(1))
    const max = parseFloat(
      ((top + gridHeight) / this.cardAndGutterHeight).toFixed(1)
    )
    const num = max - min

    uiStore.setVisibleRows({
      min,
      max,
      num,
    })
  }

  @action
  computeVisibleCols() {
    const { pageMargins } = this
    const { uiStore } = this.props
    if (!this.gridRef) return { min: null, max: null }

    const left = window.pageXOffset
    const gridWidth = window.innerWidth - pageMargins.left

    const min = parseFloat((left / this.cardAndGutterWidth).toFixed(1))
    const max = parseFloat(
      ((left + gridWidth) / this.cardAndGutterWidth).toFixed(1)
    )
    const num = max - min

    uiStore.setVisibleCols({
      min,
      max,
      num,
    })
  }

  // Finds row and column from an x,y coordinate
  coordinatesForPosition = position => {
    const { collection } = this.props
    const { x, y } = position
    let width = 1
    if (position.width && !this.hoveringOverCollection) {
      // if we're hovering over a collection we leave the virtual width at 1
      // so that we can still drag wide cards over 1x1 collections
      width = position.width
    }
    const { gridW, gridH, gutter } = this.gridSettings
    const { relativeZoomLevel } = this

    let col = Math.floor((x / (gridW + gutter)) * relativeZoomLevel)
    let row = Math.floor((y / (gridH + gutter)) * relativeZoomLevel)
    if (row < 0) {
      row = 0
    }
    // even though we restrict coordinates to being within the grid,
    // we want to know if horizontalScroll should be disabled based on unmodified col
    const outsideDraggableArea = col >= collection.num_columns || col < 0

    col = _.clamp(col, 0, collection.num_columns - width)
    return { col, row, outsideDraggableArea }
  }

  findOverlap(card) {
    const { collection, uiStore } = this.props
    const { row, col, height, width } = card
    let h = 1
    let w = 1
    const { cardMatrix } = collection

    while (h <= height) {
      while (w <= width) {
        const filledRow = row + h - 1
        const filledCol = col + w - 1
        const searchRow = cardMatrix[filledRow]
        const found = searchRow && searchRow[filledCol]
        if (
          found &&
          (uiStore.cardAction !== 'move' ||
            // don't consider overlapping itself when performing a move,
            // or when multiMoveCardIds is empty (prob result of a timing issue, because you're actually done dragging)
            (uiStore.multiMoveCardIds.length > 0 &&
              !_.includes(uiStore.multiMoveCardIds, found.id)))
        ) {
          return {
            card: found,
            record: found.record,
            holdingOver: false,
          }
        }
        w += 1
      }
      w = 1
      h += 1
    }

    return false
  }

  getDraggedOnSpot(coords) {
    return this.props.uiStore.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  @action
  handleZoomOut = () => {
    const { uiStore } = this.props
    uiStore.zoomOut()
    this.updateCollectionScrollBottom()
  }

  @action
  handleZoomIn = () => {
    const { uiStore } = this.props
    uiStore.zoomIn()
    this.updateCollectionScrollBottom()
  }

  updateCollectionScrollBottom() {
    const { collection } = this.props
    const { gridH, gutter } = this.gridSettings
    const y =
      (collection.max_row_index * (gridH + gutter)) / this.relativeZoomLevel
    collection.updateScrollBottom(y)
  }

  handleScroll = ev => {
    this.throttledLoadAfterScroll()
  }

  originalCard(cardId) {
    const { apiStore } = this.props
    let realCardId = cardId
    if (_.includes(cardId, '-mdlPlaceholder')) {
      realCardId = cardId.replace('-mdlPlaceholder', '')
    }
    // use apiStore to find this card which may exist outside this collection
    return apiStore.find('collection_cards', realCardId)
  }

  onDragStart = cardId => {
    const card = this.originalCard(cardId)
    this.draggingMap = this.determineDragMap(card.id)
  }

  @action
  onDrag = (cardId, dragPosition) => {
    this.dragging = true
    const card = this.originalCard(cardId)

    // TODO considering changing dragX in MoveableGridCard
    const cardPosition = {
      x: dragPosition.dragX,
      y: dragPosition.dragY,
      width: card.width,
      height: card.height,
    }
    const cardDims = { width: card.width, height: card.height }
    const cardCoords = this.coordinatesForPosition(cardPosition)
    if (cardCoords.outsideDraggableArea) {
      this.disableHorizontalScroll = true
    } else {
      this.disableHorizontalScroll = false
    }
    this.debouncedSetDraggedOnSpots(
      { card, ...cardCoords, ...cardDims },
      dragPosition
    )
  }

  onDragOrResizeStop = (cardId, dragType) => {
    const {
      collection: { collection_cards },
    } = this.props
    const card = _.find(collection_cards, ['id', cardId])
    if (dragType === 'resize') {
      this.resizeCard(card)
    } else {
      this.moveCards(card)
    }
    runInAction(() => {
      this.disableHorizontalScroll = false
    })
  }

  onResize = (cardId, newSize) => {
    if (!this.resizing) {
      runInAction(() => {
        this.resizing = true
      })
    }
    const {
      collection: { collection_cards },
    } = this.props
    const positionedCard = _.find(collection_cards, { id: cardId })

    const { row, col } = positionedCard
    const { width, height } = newSize
    this.throttledSetResizeSpot({ col, row, height, width })
  }

  resizeCard = card => {
    let undoMessage
    const { collection, trackCollectionUpdated, uiStore } = this.props
    let { height, width } = uiStore.placeholderSpot
    // Some double-checking validations
    const maxHeight = this.calcEdgeRow(card)
    const maxWidth = this.calcEdgeCol(card)
    if (height > maxHeight) height = maxHeight
    if (width > maxWidth) width = maxWidth
    // set up action to undo
    if (card.height !== height || card.width !== width) {
      undoMessage = 'Card resize undone'
    }
    const updates = [
      {
        card,
        width,
        height,
      },
    ]
    const onConfirm = () => trackCollectionUpdated()

    // If a template, warn that any instances will be updated
    collection.API_batchUpdateCardsWithUndo({
      updates,
      undoMessage,
      onConfirm,
    })

    // don't close MDL when performing a resize
    this.resetCardPositions({ keepMDLOpen: true })
  }

  moveCards = async masterCard => {
    const { apiStore, uiStore, collection } = this.props
    if (uiStore.dragGridSpot.size < 1) return

    const {
      movingFromCollectionId,
      cardAction,
      draggingFromMDL,
      movingCardsOverflow,
    } = uiStore
    // capture this as a normal array before it gets changed/observed e.g. in onConfirmOrCancel
    const multiMoveCardIds = [...uiStore.multiMoveCardIds]
    const undoMessage = 'Card move undone'

    const dragGridSpotValues = [...uiStore.dragGridSpot.values()]
    const movePlaceholder = dragGridSpotValues[0]
    const masterRow = movePlaceholder.row

    // This is for dragging onto the breadcrumb
    if (uiStore.activeDragTarget) {
      const targetRecord = uiStore.activeDragTarget.item
      if (uiStore.activeDragTarget.item.id === 'homepage') {
        targetRecord.id = apiStore.currentUserCollectionId
      }
      uiStore.setMovingCards(multiMoveCardIds, {
        cardAction: 'moveWithinCollection',
      })
      this.moveCardsIntoCollection(uiStore.multiMoveCardIds, targetRecord)
      return
    }

    if (this.hoveringOverCollection) {
      this.moveCardsIntoCollection(
        uiStore.multiMoveCardIds,
        this.hoveringOverCollection
      )
      return
    } else if (
      this.hasDragCollision ||
      // movePlaceholder won't have row/col keys if it's not being rendered)
      typeof masterRow === 'undefined'
    ) {
      // this means you tried to drop it over an existing card (or there was no placeholder i.e. you dragged offscreen)
      this.resetCardPositions({ keepMDLOpen: draggingFromMDL })
      return
    }

    const movingWithinCollection =
      cardAction === 'move' && movingFromCollectionId === collection.id

    const updates = []
    let outsideDraggableArea = false
    // dragGridSpot has the positions of all the dragged cards
    const draggingPlaceholders = dragGridSpotValues
    _.each(draggingPlaceholders, placeholder => {
      const { card, row, col } = placeholder
      const update = {
        card,
        row,
        col,
      }
      updates.push(update)
      if (row < 0 || col < 0 || col + card.width > collection.num_columns) {
        outsideDraggableArea = true
        return false
      }
      return update
    })

    const onConfirmOrCancel = ({ keepMDLOpen = false } = {}) => {
      this.resetCardPositions({ keepMDLOpen })
      uiStore.reselectCardIds(multiMoveCardIds)
    }
    const onCancel = () => onConfirmOrCancel({ keepMDLOpen: true })

    if (outsideDraggableArea) {
      return onCancel()
    } else if (
      movingCardsOverflow ||
      (draggingFromMDL && !movingWithinCollection)
    ) {
      // movePlaceholder will represent the MDL dragged card position
      let { row, col } = movePlaceholder
      let collection_card_ids = uiStore.movingCardIds
      const topLeftCard = findTopLeftCard(draggingPlaceholders)
      if (!draggingFromMDL) {
        // in this case we have "selected all" and are dragging more than what's actually visible
        collection_card_ids = uiStore.multiMoveCardIds
        row = topLeftCard.row
        col = topLeftCard.col
      }
      if (!draggingFromMDL) {
        // if we're overflowing, add the loading state while the cards get properly moved
        uiStore.update('isTransparentLoading', true)
      }
      await CardMoveService.moveCards(
        { row, col },
        { collection_card_ids },
        // pass in original card so we have it's unmoved row/col
        topLeftCard.card
      )
      this.resetCardPositions()
      uiStore.update('isLoading', false)
      return
    }

    collection.API_batchUpdateCardsWithUndo({
      updates,
      undoMessage,
      onConfirm: onConfirmOrCancel,
      onCancel,
    })
  }

  async moveCardsIntoCollection(cardIds, hoveringRecord) {
    const afterCancelOrSuccess = () => {
      this.setHoveringOver(false)
      // Call so it resets moving / doesn't look like drag collision
      this.resetCardPositions()
    }
    this.props.collection.API_moveCardsIntoCollection({
      toCollection: hoveringRecord,
      cardIds,
      onCancel: afterCancelOrSuccess,
      onSuccess: () => {
        afterCancelOrSuccess()
      },
    })
  }

  // reset the grid back to its original state
  @action
  resetCardPositions({ keepMDLOpen = false } = {}) {
    const { uiStore } = this.props
    uiStore.dragGridSpot.clear()
    this.dragging = false
    this.resizing = false
    this.draggingCardMasterPosition = {}
    uiStore.setPlaceholderSpot(this.placeholderDefaults)
    if (!keepMDLOpen) {
      uiStore.setMovingCards([])
    }
  }

  /*
   * Sets the current spots that are being dragged on, whether it's a card
   * or a blank spot that then has to be rendered
   */
  @action
  setDraggedOnSpots(masterPosition, dragPosition) {
    if (!this.dragging || !masterPosition) return
    const { collection, uiStore } = this.props

    // If master dragging position hasn't changed, don't need to do anything
    if (objectsEqual(masterPosition, this.draggingCardMasterPosition)) {
      return
    }

    this.draggingCardMasterPosition = masterPosition
    // reset these
    uiStore.dragGridSpot.clear()
    this.hasDragCollision = false
    if (USE_COLLISION_DETECTION_ON_DRAG) {
      this.openSpotMatrix = calculateOpenSpotMatrix({
        collection,
        multiMoveCardIds: uiStore.multiMoveCardIds,
      })
    }

    // track this before any collision modifications
    const unmodifiedMasterPosition = { ...masterPosition }
    this.updateDragGridSpotWithOpenPosition(masterPosition)
    const previousHoveringOver = { ...this.hoveringOver }
    // store whatever card (or not) that we're hovering over
    this.setHoveringOver(this.findOverlap(unmodifiedMasterPosition))

    // Loop through any additional cards and add drag spots for them
    if (uiStore.multiMoveCardIds.length > 1) {
      // track the "bumper" guard rails of keeping things in bounds of the grid
      const bump = { col: 0, row: 0 }
      this.draggingMap.forEach(mapped => {
        const relativePosition = {
          col: mapped.col + masterPosition.col,
          row: mapped.row + masterPosition.row,
          width: mapped.card.width,
          height: mapped.card.height,
          card: mapped.card,
        }
        const bumped = this.updateDragGridSpotWithOpenPosition(relativePosition)
        _.each(['row', 'col'], i => {
          if (bumped[i] && Math.abs(bumped[i]) > Math.abs(bump[i])) {
            bump[i] = bumped[i]
          }
        })
      })
      if (bump.col !== 0 || bump.row !== 0) {
        // reset these
        uiStore.dragGridSpot.clear()
        // one more pass if we needed to bump things
        masterPosition.col += bump.col
        masterPosition.row += bump.row
        this.updateDragGridSpotWithOpenPosition(masterPosition)
        this.draggingMap.forEach(mapped => {
          const relativePosition = {
            col: mapped.col + masterPosition.col,
            row: mapped.row + masterPosition.row,
            width: mapped.card.width,
            height: mapped.card.height,
            card: mapped.card,
          }
          this.updateDragGridSpotWithOpenPosition(relativePosition)
        })
      }
    }

    if (
      this.hoveringOver &&
      (!previousHoveringOver.card ||
        this.hoveringOver.card !== previousHoveringOver.card)
    ) {
      // if we've changed cards we're hovering over... start a new dragTimeout
      this.clearDragTimeout()
      const dragTimeoutId = setTimeout(() => {
        if (!this.hoveringOverCollection) {
          return
        }
        this.hoveringOver.holdingOver = true
        this.setHoveringOver(this.hoveringOver)
      }, v.cardHoldTime)
      this.dragTimeoutId = dragTimeoutId
    }
  }

  @action
  updateDragGridSpotWithOpenPosition(position) {
    const { collection, uiStore } = this.props
    // track number of spaces (row/col) we may need to bump things to stay "in bounds"
    const bump = {}
    if (!USE_COLLISION_DETECTION_ON_DRAG) {
      const { col, row, width } = position
      if (col < 0) {
        bump.col = 0 - col
      } else if (col + width > collection.num_columns) {
        bump.col = collection.num_columns - (col + width)
      }
      if (row < 0) {
        bump.row = 0 - row
      } else if (collection.isSplitLevel && row > collection.max_row_index) {
        // don't allow dragging down past the divider mid-splitLevel
        bump.row = collection.max_row_index - row
      }

      if (!_.isEmpty(bump)) return bump
      uiStore.dragGridSpot.set(getMapKey(position), position)
      this.hasDragCollision =
        this.hasDragCollision || !!this.findOverlap(position)
      return {}
    }
    // NOTE: may not be reachable
    const openSpot = findClosestOpenSpot(
      position,
      this.openSpotMatrix,
      collection.num_columns
    )
    if (openSpot) {
      const {
        collection,
        uiStore: { multiMoveCardIds },
      } = this.props
      position.row = openSpot.row
      position.col = openSpot.col
      uiStore.dragGridSpot.set(getMapKey(position), position)
      // have to recalculate to consider this dragged spot
      this.openSpotMatrix = calculateOpenSpotMatrix({
        collection,
        multiMoveCardIds,
        dragGridSpot: uiStore.dragGridSpot,
        withDraggedSpots: true,
      })
    } else {
      this.hasDragCollision = true
    }
  }

  get hoveringOverCollection() {
    if (
      this.hoveringOver &&
      this.hoveringOver.record.internalType === 'collections'
    ) {
      return this.hoveringOver.record
    }
    return null
  }

  setHoveringOver(val) {
    const { uiStore } = this.props
    this.hoveringOver = val
    uiStore.setHoveringOver(val)
  }

  /*
   * The drag map is an array of spots that represents the positions of all
   * cards that are being dragged relative to the card actually being dragged
   *
   * Card being dragged: { col: 2, row: 1}
   * Other card dragged along: { col: 3, row: 1}
   * Drag map: [{ col: 0, row: 0}, { col: 1, row: 0}]
   */
  determineDragMap(cardId) {
    const { collection, apiStore, uiStore } = this.props
    const {
      multiMoveCardIds,
      movingFromCollectionId,
      draggingFromMDL,
    } = uiStore

    let movingFromCollection = collection
    if (movingFromCollectionId) {
      // this may not be set in uiStore if you're just dragging within the collection
      movingFromCollection = apiStore.find(
        'collections',
        movingFromCollectionId
      )
    }
    // The master card is the card currently being dragged
    const masterCard = apiStore.find('collection_cards', cardId)
    const movingCardIds = multiMoveCardIds.filter(id => id !== cardId)

    let overflow = false
    let movingCards = _.compact(
      movingCardIds.map(movingCardId => {
        const card = apiStore.find('collection_cards', movingCardId)
        if (!card) {
          // if card is not in memory that means it's offscreen i.e. overflow
          overflow = true
        }
        return card
      })
    )

    this.movingFromNormalCollection = false
    if (!movingFromCollection.isBoard) {
      this.movingFromNormalCollection = true
      // make sure masterCard is factored into position calculation
      movingCards.unshift(masterCard)
      // this will add .position to each card
      movingCards = calculateRowsCols(movingCards)
    }
    this.masterCard = masterCard
    this.movingCards = movingCards
    // Loop through non-master cards to calculate drag map
    const dragMap = movingCards.map(card => {
      let { col, row } = card
      let masterCol = masterCard.col
      let masterRow = masterCard.row
      if (!movingFromCollection.isBoard) {
        // in this case we're moving cards from CollectionGrid to Foamcore
        const { position } = card
        col = position.x
        row = position.y
        masterCol = masterCard.position.x
        masterRow = masterCard.position.y
      }
      const colDiff = col - masterCol
      const rowDiff = row - masterRow

      if (draggingFromMDL && Math.abs(rowDiff) > 6) {
        // overflow means rows are hidden/faded out beyond 6 rows
        overflow = true
        return
      }

      return {
        card,
        col: colDiff,
        row: rowDiff,
      }
    })
    uiStore.update('movingCardsOverflow', overflow)
    return _.compact(dragMap)
  }

  setResizeSpot({ row, col, width, height }) {
    const { uiStore } = this.props
    uiStore.setPlaceholderSpot({
      row,
      col,
      width,
      height,
      type: 'resize',
    })
  }

  findFilledSpot({ col, row }, cardId = null) {
    if (!_.isNumber(col) || _.isNaN(col)) return null
    const { collection, uiStore } = this.props
    const filledRow = collection.cardMatrix[row]
    const foundCard = filledRow ? filledRow[col] : null
    if (foundCard) {
      if (
        foundCard.id === cardId ||
        _.includes(uiStore.multiMoveCardIds, foundCard.id)
      ) {
        return false
      }
      return foundCard
    }
    return false
  }

  calcEdgeCol({ id, col, row, width, height }) {
    // start from outer column (e.g. width=1, col=0: start at col 1)
    let tempCol = col + width
    let tempRow = row
    while (tempCol < col + MAX_CARD_W) {
      tempRow = row
      while (tempRow < row + height) {
        const filled = this.findFilledSpot({ col: tempCol, row: tempRow }, id)
        if (filled) {
          return tempCol - col
        }
        tempRow += 1
      }
      tempCol += 1
    }
    return MAX_CARD_W
  }

  calcEdgeRow({ id, col, row, width, height }) {
    let tempRow = row + height
    let tempCol = col
    while (tempRow < row + MAX_CARD_H) {
      tempCol = col
      while (tempCol < col + width) {
        const filled = this.findFilledSpot({ col: tempCol, row: tempRow }, id)
        if (filled) {
          return tempRow - row
        }
        tempCol += 1
      }
      tempRow += 1
    }
    return MAX_CARD_H
  }

  positionCard(card) {
    return this.renderMovableCard(card, `card-${card.id}`)
  }

  renderMovableCard(card, key) {
    const { canEditCollection, collection, uiStore } = this.props
    const { pageMargins, relativeZoomLevel } = this
    const cardType = card.record ? card.record.internalType : card.cardType

    const position = uiStore.positionForCoordinates(card)

    const dragOffset = {
      x: pageMargins.left,
      y: pageMargins.top,
    }

    const mdlInSnackbar = card.isMDLPlaceholder && !card.isDragCardMaster

    return (
      <MovableGridCard
        key={key}
        card={card}
        cardType={cardType}
        canEditCollection={canEditCollection}
        isUserCollection={collection.isUserCollection}
        isSharedCollection={collection.isSharedCollection}
        isBoardCollection
        position={position}
        dragOffset={dragOffset}
        record={card.record || {}}
        onDrag={this.onDrag}
        onDragStart={this.onDragStart}
        onDragOrResizeStop={this.onDragOrResizeStop}
        onResize={this.onResize}
        parent={collection}
        // don't apply any zoom to the mdlPlaceholder
        zoomLevel={mdlInSnackbar ? 1 : relativeZoomLevel}
        // don't allow horizontal scroll unless we are in a zoomable view
        horizontalScroll={
          this.showZoomControls && !this.disableHorizontalScroll
        }
        showHotEdge={false}
      />
    )
  }

  clearDragTimeout() {
    if (this.dragTimeoutId) {
      clearTimeout(this.dragTimeoutId)
      this.dragTimeoutId = null
    }
  }

  renderCard = cardOrBlank => {
    // If another real card is filling up the hover spot, don't render
    // the hover spot at all (which gets rendered after this loop)
    if (cardOrBlank.id) {
      return this.positionCard(cardOrBlank)
    }
    return null
  }

  renderVisibleCards() {
    const { collection } = this.props
    let cards = _.reject(
      collection.collection_cards,
      // hide additional cards that are being moved/hidden
      'shouldHideFromUI'
    )
    cards = _.map(cards, this.renderCard)

    return cards
  }

  renderAddSubmission() {
    const { collection, submissionSettings } = this.props
    if (!submissionSettings) {
      return
    }
    // add the card for "Add your submission here"
    return this.renderCard({
      width: 1,
      height: 1,
      // this card should be first
      col: 0,
      row: 0,
      id: 'submission',
      cardType: 'submission',
      parent_id: collection.id,
      submissionSettings,
    })
  }

  renderSubmissionBct() {
    const { collection, uiStore } = this.props
    const { blankContentToolState, blankContentToolIsOpen } = uiStore

    if (
      !blankContentToolIsOpen ||
      blankContentToolState.collectionId !== collection.id
    ) {
      return
    }

    const blankContentTool = {
      id: 'blank',
      blankType: 'bct',
      num: 0,
      cardType: 'blank',
      ...blankContentToolState,
    }

    return this.renderMovableCard(blankContentTool, `bct-${0}:${0}`)
  }

  // render the MDL placeholder to be draggable from the MoveSnackbar
  renderMdlPlaceholder() {
    const { apiStore, uiStore } = this.props
    const { movingCardIds } = uiStore

    if (!movingCardIds.length) {
      return
    }
    const movingCard = apiStore.find('collection_cards', _.first(movingCardIds))
    if (!movingCard || uiStore.isLoadingMoveAction) {
      return
    }
    const data = {
      cardType: 'mdlPlaceholder',
      originalId: movingCard.id,
      record: movingCard.record,
      width: movingCard.width,
      height: movingCard.height,
      position: uiStore.positionForCoordinates(movingCard),
    }
    const placeholder = new CollectionCard(data, apiStore)
    apiStore.updateModelId(placeholder, `${movingCard.id}-mdlPlaceholder`)

    return this.renderCard(placeholder)
  }

  render() {
    const { collection, canEditCollection } = this.props
    const { isSplitLevelBottom } = collection

    const gridSize = this.totalGridSize

    return (
      <Grid
        className={`${FOAMCORE_GRID_BOUNDARY}${
          isSplitLevelBottom ? '-bottom' : ''
        }`}
        data-empty-space-click
        ref={ref => {
          this.gridRef = ref
        }}
        width={gridSize.width}
        height={gridSize.height}
      >
        {!isSplitLevelBottom && this.showZoomControls && (
          <FoamcoreZoomControls
            onZoomIn={this.handleZoomIn}
            onZoomOut={this.handleZoomOut}
          />
        )}
        {this.renderMdlPlaceholder()}
        {this.renderVisibleCards()}
        {collection.isSubmissionsCollection && this.renderAddSubmission()}
        {collection.isSubmissionsCollection && this.renderSubmissionBct()}
        {canEditCollection && (
          <FoamcoreInteractionLayer
            collection={collection}
            hoveringOverCollection={!!this.hoveringOverCollection}
            coordinatesForPosition={this.coordinatesForPosition}
            dragging={this.dragging}
            resizing={this.resizing}
            hasDragCollision={this.hasDragCollision}
            relativeZoomLevel={this.relativeZoomLevel}
            maxRow={this.maxRow}
          />
        )}
      </Grid>
    )
  }
}

FoamcoreGrid.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  cardProperties: MobxPropTypes.arrayOrObservableArray.isRequired,
  trackCollectionUpdated: PropTypes.func.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  movingCardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  loadCollectionCards: PropTypes.func.isRequired,
  sorting: PropTypes.bool,
  cardIdMenuOpen: PropTypes.string,
  submissionSettings: PropTypes.shape({
    type: PropTypes.string,
    template: MobxPropTypes.objectOrObservableObject,
    enabled: PropTypes.bool,
  }),
}
FoamcoreGrid.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
FoamcoreGrid.defaultProps = {
  sorting: false,
  cardIdMenuOpen: null,
  submissionSettings: null,
}
FoamcoreGrid.displayName = 'FoamcoreGrid'

export default FoamcoreGrid
