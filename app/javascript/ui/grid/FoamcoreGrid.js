import _ from 'lodash'
import PropTypes from 'prop-types'
import { updateModelId } from 'datx'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import hexToRgba from '~/utils/hexToRgba'
import CardMoveService from '~/utils/CardMoveService'
import {
  calculateOpenSpotMatrix,
  calculateRowsCols,
  findClosestOpenSpot,
} from '~/utils/CollectionGridCalculator'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import InlineLoader from '~/ui/layout/InlineLoader'
import PlusIcon from '~/ui/icons/PlusIcon'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import FoamcoreZoomControls from '~/ui/grid/FoamcoreZoomControls'
import v from '~/utils/variables'
import { objectsEqual } from '~/utils/objectUtils'
import { calculatePageMargins } from '~/utils/pageUtils'

// set as a flag in case we ever want to enable this, it just makes a couple minor differences in logic
const USE_COLLISION_DETECTION_ON_DRAG = false

// When you have attributes that will change a lot,
// it's a performance gain to use `styled.div.attrs`
const BlankCard = styled.div.attrs(({ x, y, h, w, zoomLevel, draggedOn }) => ({
  style: {
    height: `${h}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `scale(${1 / zoomLevel})`,
    width: `${w}px`,
    cursor: 'pointer',
  },
}))`
  background: ${props => {
    if (props.type === 'unrendered') {
      return v.colors.commonLightest
    } else if (props.type === 'drag-overflow') {
      const color = props.blocked ? v.colors.alert : v.colors.primaryLight
      return `linear-gradient(
        to bottom,
        ${hexToRgba(color)} 0%,
        ${hexToRgba(color)} 25%,
        ${hexToRgba(color, 0)} 100%)`
    } else if (props.blocked) {
      return v.colors.alert
    } else if (_.includes(['blank', 'drag', 'resize'], props.type)) {
      return v.colors.primaryLight
    }
    return 'none'
  }};
  position: absolute;
  transform-origin: left top;
  opacity: ${props => {
    if (props.type === 'unrendered') return 0.75
    if (_.includes(props.type, 'drag')) return 0.5
    return 1
  }};
  z-index: ${props =>
    _.includes(props.type, 'drag') ? v.zIndex.cardHovering : 0};
  ${props =>
    props.type === 'unrendered'
      ? ''
      : `&:hover {
    background-color: ${v.colors.primaryLight} !important;
    .plus-icon {
      display: block;
    }
  }
  `} .plus-icon {
    display: none;
  }
`

const Grid = styled.div`
  position: relative;
  width: ${props => `${props.width}px`};
  min-height: ${props => `${props.height}px`};
`

export const StyledPlusIcon = styled.div`
  position: relative;
  /* TODO: better styling than this? */
  width: 20%;
  height: 20%;
  top: 38%;
  left: 38%;
  color: ${v.colors.secondaryMedium};
`

function getMapKey({ col, row }) {
  return `${col},${row}`
}

const MAX_CARD_W = 4
const MAX_CARD_H = 2
const MAX_COLS = 16
const MAX_COLS_MOBILE = 8
const FOAMCORE_MAX_ZOOM = 3
const FOUR_WIDE_MAX_ZOOM = 2

// needs to be an observer to observe changes to the collection + items
@inject('apiStore', 'routingStore', 'uiStore')
@observer
class FoamcoreGrid extends React.Component {
  gridRef = null
  @observable
  cardsToRender = []
  @observable
  zoomLevel = FOAMCORE_MAX_ZOOM
  dragGridSpot = observable.map({})
  @observable
  dragging = false
  @observable
  resizing = false
  @observable
  placeholderSpot = { ...this.placeholderDefaults }
  @observable
  // track which row # we are in the process of loading from API
  loadingRow = null
  @observable
  // track which rows are visible on the page
  visibleRows = {
    min: 0,
    max: 0,
    num: 0,
  }
  @observable
  // track which cols are visible on the page
  visibleCols = {
    min: 0,
    max: 0,
    num: 0,
  }
  @observable
  disableHorizontalScroll = false

  placeholderDefaults = {
    row: null,
    col: null,
    width: null,
    height: null,
    type: null,
  }
  draggingCardMasterPosition = {}
  draggingMap = []
  // track whether drag movement is blocked because of overlapping cards
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
    const { uiStore, collection } = this.props
    runInAction(() => {
      uiStore.selectedAreaEnabled = true
      if (collection.isFourWideBoard && this.showZoomControls) {
        this.zoomLevel = FOUR_WIDE_MAX_ZOOM
      }
    })
    this.updateCollectionScrollBottom()
    this.loadAfterScroll()
    window.addEventListener('scroll', this.handleScroll)
  }

  componentDidUpdate(prevProps) {
    this.updateSelectedArea()
    if (!objectsEqual(this.props.cardProperties, prevProps.cardProperties)) {
      // e.g. if API_fetchCards has reset the loaded cards, we may want to
      // trigger this in case we are viewing further down the page
      this.throttledLoadAfterScroll()
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

  // Load more cards if we are approaching a boundary of what we have loaded
  loadAfterScroll = async () => {
    if (this.loadingRow) return

    const { collection } = this.props
    this.computeVisibleRows()
    this.computeVisibleCols()

    if (!this.showZoomControls && this.zoomLevel > 1) {
      this.handleZoomIn()
    }

    const visRows = this.visibleRows

    // Load more rows if currently loaded rows is less than
    // one full screen out of view
    if (collection.loadedRows < visRows.max + visRows.num) {
      runInAction(() => {
        this.loadingRow = collection.loadedRows + 1
      })
      await this.loadMoreRows()
      runInAction(() => {
        this.loadingRow = null
      })
    }
  }

  loadMoreRows = () => {
    const { collection, loadCollectionCards } = this.props
    const visRows = this.visibleRows
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
      return loadCollectionCards({
        // just load by row # downward, and always load all 16 cols
        rows: [loadMinRow, loadMaxRow],
      })
    }
  }

  get pageMargins() {
    const { collection } = this.props
    return {
      ...calculatePageMargins({ fullWidth: collection.isFourWideBoard }),
      top: v.headerHeight + 90,
    }
  }

  get maxCols() {
    const { collection, uiStore } = this.props
    if (collection.num_columns === 4) return 4

    return uiStore.isTouchDevice && uiStore.isMobile
      ? MAX_COLS_MOBILE
      : MAX_COLS
  }

  get maxZoom() {
    const { collection } = this.props
    return collection.isFourWideBoard ? FOUR_WIDE_MAX_ZOOM : FOAMCORE_MAX_ZOOM
  }

  // Default zoom level is that which fits all columns in the browser viewport
  get relativeZoomLevel() {
    const { pageMargins } = this
    if (this.zoomLevel !== this.maxZoom) return this.zoomLevel
    // TODO: at some browser sizes + maxCols, there should really only be 2 zoom levels....

    const { gridW, gutter } = this.gridSettings
    const gridWidth =
      (gridW + gutter) * this.maxCols + pageMargins.left * 2 * this.zoomLevel
    const relative = gridWidth / window.innerWidth
    return _.max([relative, 1])
  }

  get showZoomControls() {
    const { pageMargins } = this
    const { gridW, gutter } = this.gridSettings
    const gridWidth = (gridW + gutter) * this.maxCols + pageMargins.left * 2
    // only show zoom if the grid is wider than our window
    return gridWidth > window.innerWidth
  }

  get gridSettings() {
    // Foamcore doesn't change gridSettings based on browser size,
    // instead always refer to the defaults
    return v.defaultGridSettings
  }

  // TODO: figure out why we need to calculate the max width and height of the grid, what does this do?
  // one theory -- for mobile touch scrolling?
  get totalGridSize() {
    const { gridW, gridH, gutter } = this.gridSettings
    const { collection } = this.props
    // Max rows is the max row of any current cards (max_row_index)
    // + 1, since it is zero-indexed,
    // + 2x the visible number of rows
    // for padding to allow scrolling beyond the current cards
    const visRows = this.visibleRows.num || 1
    const maxRows = collection.max_row_index + 1 + visRows * 2
    const height = ((gridH + gutter) * maxRows) / this.relativeZoomLevel
    const width = ((gridW + gutter) * this.maxCols) / this.relativeZoomLevel
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

  @action
  computeVisibleRows() {
    const { pageMargins } = this
    if (!this.gridRef) return { min: null, max: null }

    const top = window.scrollY || window.pageYOffset
    const gridHeight = window.innerHeight - pageMargins.top

    const min = parseFloat((top / this.cardAndGutterHeight).toFixed(1))
    const max = parseFloat(
      ((top + gridHeight) / this.cardAndGutterHeight).toFixed(1)
    )
    const num = max - min

    this.visibleRows = {
      min,
      max,
      num,
    }
  }

  @action
  computeVisibleCols() {
    const { pageMargins } = this
    if (!this.gridRef) return { min: null, max: null }

    const left = window.scrollX || window.pageXOffset
    const gridWidth = window.innerWidth - pageMargins.left

    const min = parseFloat((left / this.cardAndGutterWidth).toFixed(1))
    const max = parseFloat(
      ((left + gridWidth) / this.cardAndGutterWidth).toFixed(1)
    )
    const num = max - min

    this.visibleCols = {
      min,
      max,
      num,
    }
  }

  // Finds row and column from an x,y coordinate
  coordinatesForPosition(position) {
    const { x, y } = position
    const { gridW, gridH, gutter } = this.gridSettings
    const { relativeZoomLevel } = this

    const col = Math.floor((x / (gridW + gutter)) * relativeZoomLevel)
    const row = Math.floor((y / (gridH + gutter)) * relativeZoomLevel)

    // could return negative, but setDraggedOnSpots will deal with this appropriately
    return { col, row }
  }

  positionForCoordinates({ col, row, width = 1, height = 1 }) {
    const { gridW, gridH, gutter } = this.gridSettings
    const { relativeZoomLevel } = this
    const pos = {
      x: (col * (gridW + gutter)) / relativeZoomLevel,
      y: (row * (gridH + gutter)) / relativeZoomLevel,
      w: width * (gridW + gutter) - gutter,
      h: height * (gridH + gutter) - gutter,
    }
    // TODO: why sometimes NaN? zoomLevel divide by 0??
    if (_.isNaN(pos.x)) {
      pos.x = 0
      pos.y = 0
    }
    // TODO try and get rid of {x|y}Pos
    return {
      ...pos,
      xPos: pos.x,
      yPos: pos.y,
      width: pos.w,
      height: pos.h,
    }
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
            // don't consider overlapping itself when performing a move
            !_.includes(uiStore.multiMoveCardIds, found.id))
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
    return this.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  // Adjusts global x,y coords to foamcore grid coords
  get selectedAreaAdjustedForGrid() {
    const { pageMargins } = this
    const { selectedArea } = this.props
    let { minX, minY, maxX, maxY } = selectedArea

    // If no area is selected, return null values
    if (minX === null) return selectedArea

    // Adjust coordinates by page margins
    minX -= pageMargins.left
    minY -= pageMargins.top
    maxX -= pageMargins.left
    maxY -= pageMargins.top

    // If the user is selecting outside of the grid,
    // set to 0 if the bottom of selected area is over the grid
    if (minX < 0 && maxX > 0) minX = 0
    if (minY < 0 && maxY > 0) minY = 0

    return {
      minX,
      minY,
      maxX,
      maxY,
    }
  }

  updateSelectedArea = () => {
    const { collection, uiStore } = this.props
    const { minX, minY, maxX, maxY } = this.selectedAreaAdjustedForGrid

    // Check if there is a selected area
    if (minX === null) return

    // Select all cards that this drag rectangle 'touches'
    const topLeftCoords = this.coordinatesForPosition({
      x: minX,
      y: minY,
    })
    const bottomRightCoords = this.coordinatesForPosition({
      x: maxX,
      y: maxY,
    })

    // Return if it couldn't find cards in both positions
    if (!topLeftCoords || !bottomRightCoords) return

    let selectedCardIds = collection.cardIdsWithinRectangle(
      topLeftCoords,
      bottomRightCoords
    )
    if (uiStore.selectedAreaShifted) {
      selectedCardIds = _.union(selectedCardIds, uiStore.selectedCardIds)
    }
    runInAction(() => {
      uiStore.selectedCardIds = selectedCardIds
    })
  }

  handleBlankCardClick = ({ row, col }) => e => {
    const { selectedAreaMinX } = this.props

    // If user is selecting an area, don't trigger blank card click
    if (selectedAreaMinX) {
      console.log({ selectedAreaMinX }, 'returning...')
      return
    }

    const { uiStore } = this.props
    uiStore.openBlankContentTool({
      row,
      col,
    })
  }

  @action
  handleZoomOut = () => {
    if (this.zoomLevel >= this.maxZoom) {
      this.zoomLevel = this.maxZoom
      return
    }
    this.zoomLevel = this.zoomLevel + 1
    this.updateCollectionScrollBottom()
  }

  @action
  handleZoomIn = () => {
    if (this.zoomLevel === 1) return
    this.zoomLevel = this.zoomLevel - 1
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

    const { collection } = this.props
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
    if (cardCoords.col >= collection.num_columns) {
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
    const { collection, trackCollectionUpdated } = this.props
    let { height, width } = this.placeholderSpot
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

    this.resetCardPositions()
  }

  moveCards = async masterCard => {
    if (this.dragGridSpot.size < 1) return
    const { uiStore, collection } = this.props
    const {
      movingFromCollectionId,
      cardAction,
      draggingFromMDL,
      overflowFromMDL,
    } = uiStore
    // capture this as a normal array before it gets changed/observed e.g. in onConfirmOrCancel
    const multiMoveCardIds = [...uiStore.multiMoveCardIds]
    const undoMessage = 'Card move undone'

    const dragGridSpotValues = [...this.dragGridSpot.values()]
    const movePlaceholder = dragGridSpotValues[0]
    const masterRow = movePlaceholder.row

    // This is for dragging onto the breadcrumb
    if (uiStore.activeDragTarget) {
      const { apiStore } = this.props
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
      draggingFromMDL &&
      (overflowFromMDL || !movingWithinCollection)
    ) {
      // movePlaceholder will represent the MDL dragged card position
      const { row, col } = movePlaceholder
      await CardMoveService.moveCards({ row, col })
      this.resetCardPositions()
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
  resetCardPositions({ keepMDLOpen = false } = {}) {
    const { uiStore } = this.props
    runInAction(() => {
      this.dragGridSpot.clear()
      this.dragging = false
      this.resizing = false
      this.draggingCardMasterPosition = {}
      this.setPlaceholderSpot(this.placeholderDefaults)
      if (!keepMDLOpen) {
        uiStore.setMovingCards([])
      }
    })
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
    if (objectsEqual(masterPosition, this.draggingCardMasterPosition)) return
    this.draggingCardMasterPosition = masterPosition

    // reset these
    this.dragGridSpot.clear()
    this.hasDragCollision = false
    if (USE_COLLISION_DETECTION_ON_DRAG) {
      this.openSpotMatrix = calculateOpenSpotMatrix({
        collection,
        multiMoveCardIds: uiStore.multiMoveCardIds,
      })
    }

    // Add master dragging card
    const unmodifiedMasterPosition = { ...masterPosition }
    this.updateDragGridSpotWithOpenPosition(masterPosition)

    // Loop through any additional cards and add drag spots for them
    if (uiStore.multiMoveCardIds.length > 1) {
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

    const previousHoveringOver = { ...this.hoveringOver }
    // store whatever card (or not) that we're hovering over
    this.setHoveringOver(this.findOverlap(unmodifiedMasterPosition))
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
    const { collection } = this.props
    if (!USE_COLLISION_DETECTION_ON_DRAG) {
      const { row, col, width } = position
      if (row < 0 || col < 0 || col + width > collection.num_columns) {
        this.hasDragCollision = true
        return
      }
      this.dragGridSpot.set(getMapKey(position), position)
      this.hasDragCollision =
        this.hasDragCollision || this.findOverlap(position)
      return
    }
    const openSpot = findClosestOpenSpot(position, this.openSpotMatrix)
    if (openSpot) {
      const {
        collection,
        uiStore: { multiMoveCardIds },
      } = this.props
      position.row = openSpot.row
      position.col = openSpot.col
      this.dragGridSpot.set(getMapKey(position), position)
      // have to recalculate to consider this dragged spot
      this.openSpotMatrix = calculateOpenSpotMatrix({
        collection,
        multiMoveCardIds,
        dragGridSpot: this.dragGridSpot,
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
    const { multiMoveCardIds, movingFromCollectionId } = uiStore

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

    let movingCards = movingCardIds.map(movingCardId => {
      return apiStore.find('collection_cards', movingCardId)
    })

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
    let overflow = 0
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

      if (uiStore.draggingFromMDL && Math.abs(rowDiff) > 6) {
        overflow += 1
        return
      }

      return {
        card,
        col: colDiff,
        row: rowDiff,
      }
    })
    uiStore.update('overflowFromMDL', overflow)
    return _.compact(dragMap)
  }

  setResizeSpot({ row, col, width, height }) {
    this.setPlaceholderSpot({
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
    const { canEditCollection, collection, routingStore } = this.props
    const cardType = card.record ? card.record.internalType : card.cardType
    const position = this.positionForCoordinates(card)

    // TODO reorganize
    if (
      card.id === 'blank' &&
      this.zoomLevel !== 1 &&
      !collection.isFourWideBoard
    ) {
      position.xPos = position.x - this.zoomLevel * 38
      position.yPos = position.y - this.zoomLevel * 30
    }

    const dragOffset = this.pageMargins

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
        routeTo={routingStore.routeTo}
        parent={collection}
        // don't apply any zoom to the mdlPlaceholder
        zoomLevel={mdlInSnackbar ? 1 : this.relativeZoomLevel}
        // don't allow horizontal scroll unless we are in a zoomable view
        horizontalScroll={
          this.showZoomControls && !this.disableHorizontalScroll
        }
        showHotEdge={false}
      />
    )
  }

  positionBlank({ row, col, width, height }, type = 'drag') {
    const position = this.positionForCoordinates({ col, row, width, height })

    const { relativeZoomLevel } = this
    let inner = ''
    if (type === 'hover') {
      inner = (
        <StyledPlusIcon className="plus-icon">
          <PlusIcon />
        </StyledPlusIcon>
      )
    } else if (type === 'unrendered') {
      inner = <InlineLoader background={v.colors.commonLightest} />
    }

    // could be drag or drag-overflow
    const isDrag = _.includes(type, 'drag')

    return (
      <BlankCard
        onClick={this.handleBlankCardClick({ col, row })}
        {...position}
        type={type}
        zoomLevel={relativeZoomLevel}
        key={`blank-${type}-${row}:${col}`}
        /* Why is this rendering on top of a collection? */
        blocked={this.hasDragCollision && isDrag}
        data-blank-type={type}
        data-empty-space-click
        draggedOn
      >
        {inner}
      </BlankCard>
    )
  }

  positionBct({ col, row, width, height }) {
    // TODO this has to be documented
    const blankContentTool = {
      id: 'blank',
      num: 0,
      cardType: 'blank',
      blankType: null,
      col,
      row,
      width,
      height,
    }
    return this.renderMovableCard(blankContentTool, `bct-${col}:${row}`)
  }

  cardWithinViewPlusPage = card => {
    // Select all cards that are within view,
    // plus half a screen on any side
    const rows = this.visibleRows
    const cols = this.visibleCols

    const numRows = Math.ceil(rows.num)
    const numCols = Math.ceil(cols.num)

    const withinCols =
      card.col > cols.min - numCols && card.col < cols.max + numCols
    const withinRows =
      card.row > rows.min - numRows && card.row < rows.max + numRows

    return withinRows && withinCols
  }

  @action
  setPlaceholderSpot = (placeholderSpot = this.placeholderDefaults) => {
    if (!objectsEqual(this.placeholderSpot, placeholderSpot)) {
      const { row, col, width, height, type } = placeholderSpot
      this.placeholderSpot.row = row
      this.placeholderSpot.col = col
      this.placeholderSpot.width = width
      this.placeholderSpot.height = height
      this.placeholderSpot.type = type
    }
  }

  get blankCardsForEmptySpacesWithinVisibleArea() {
    const { collection } = this.props
    const { cardMatrix } = collection
    const blankCards = []
    // Add blank cards to all empty spaces,
    // and 2x screen heights at the bottom
    _.each(
      _.range(0, collection.max_row_index + this.visibleRows.num * 2),
      row => {
        _.each(_.range(0, this.maxCols), col => {
          // If there's no row, or nothing in this column, add a blank card for this spot
          const blankCard = { row, col, width: 1, height: 1 }
          if (!cardMatrix[row] || !cardMatrix[row][col]) {
            if (this.cardWithinViewPlusPage(blankCard)) {
              blankCards.push(this.positionBlank(blankCard, 'hover'))
            }
          }
        })
      }
    )
    return blankCards
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
    if (cardOrBlank.id === 'blank') {
      return this.positionBct(cardOrBlank)
    } else if (_.includes(['unrendered', 'resize'], cardOrBlank.id)) {
      return this.positionBlank(cardOrBlank, cardOrBlank.id)
    } else if (cardOrBlank.id) {
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

  renderDragSpots() {
    if (!this.dragGridSpot.size || this.hoveringOverCollection) {
      return
    }
    const { overflowFromMDL } = this.props.uiStore

    const draggingPlaceholders = [...this.dragGridSpot.values()]
    const maxRowCard = _.maxBy(draggingPlaceholders, 'row')
    const maxRow = maxRowCard && maxRowCard.row
    return _.map(draggingPlaceholders, placeholder => {
      placeholder.id = 'drag'
      const atMaxRow =
        placeholder.row === maxRow ||
        placeholder.row + placeholder.height - 1 === maxRow
      if (overflowFromMDL && atMaxRow) {
        placeholder.id = 'drag-overflow'
      }
      return this.positionBlank(placeholder, placeholder.id)
    })
  }

  renderBlanksAndBct() {
    const { collection, apiStore, uiStore, canEditCollection } = this.props
    const { num_columns } = collection
    const { movingCardIds, blankContentToolState } = uiStore
    let cards = []

    const leftPad = num_columns > 4 ? 3 : 0
    const across = _.min([10, num_columns])
    if (this.loadingRow) {
      _.times(across, i => {
        _.times(4, j => {
          cards.push({
            id: 'unrendered',
            // loading squares are centered, 3 from the left
            col: i + leftPad,
            // 3 down from the beginning of loadingRow
            row: this.loadingRow + j + 3,
            width: 1,
            height: 1,
          })
        })
      })
    }

    if (uiStore.blankContentToolIsOpen) {
      cards.push({
        id: 'blank',
        blankType: 'bct',
        ...blankContentToolState,
      })
    }
    if (this.placeholderSpot) {
      cards.push({
        id: 'resize',
        ...this.placeholderSpot,
      })
    }

    if (movingCardIds && movingCardIds.length) {
      const movingCard = apiStore.find(
        'collection_cards',
        _.first(movingCardIds)
      )

      if (!uiStore.isLoadingMoveAction && movingCard) {
        const data = {
          cardType: 'mdlPlaceholder',
          originalId: movingCard.id,
          record: movingCard.record,
          width: movingCard.width,
          height: movingCard.height,
          position: this.positionForCoordinates(movingCard),
        }
        const placeholder = new CollectionCard(data, apiStore)
        updateModelId(placeholder, `${movingCard.id}-mdlPlaceholder`)
        cards.push(placeholder)
      }
    }

    cards = _.map(cards, this.renderCard)

    if (canEditCollection && !this.dragging) {
      // Add blank cards for all empty spaces - for hover and click -> BCT actions
      // NOTE: this may be a factor in more re-renders as it will update as you scroll
      cards = [...cards, ...this.blankCardsForEmptySpacesWithinVisibleArea]
    }

    return cards
  }

  render() {
    const gridSize = this.totalGridSize
    return (
      <Grid
        className="foamcoreGridBoundary"
        data-empty-space-click
        ref={ref => {
          this.gridRef = ref
        }}
        width={gridSize.width}
        height={gridSize.height}
      >
        {this.showZoomControls && (
          <FoamcoreZoomControls
            onZoomIn={this.handleZoomIn}
            onZoomOut={this.handleZoomOut}
          />
        )}
        {this.renderDragSpots()}
        {this.renderBlanksAndBct()}
        {this.renderVisibleCards()}
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
  blankContentToolState: MobxPropTypes.objectOrObservableObject,
  loadCollectionCards: PropTypes.func.isRequired,
  selectedArea: MobxPropTypes.objectOrObservableObject.isRequired,
  selectedAreaMinX: PropTypes.number,
  sorting: PropTypes.bool,
  cardIdMenuOpen: PropTypes.string,
}
FoamcoreGrid.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
FoamcoreGrid.defaultProps = {
  blankContentToolState: {},
  sorting: false,
  selectedAreaMinX: null,
  cardIdMenuOpen: null,
}
FoamcoreGrid.displayName = 'FoamcoreGrid'

export default FoamcoreGrid
