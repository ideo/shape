import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import hexToRgba from '~/utils/hexToRgba'
import CardMoveService from '~/utils/CardMoveService'
import {
  calculateOpenSpotMatrix,
  calculateRowsCols,
  findClosestOpenSpot,
  findTopLeftCard,
} from '~/utils/CollectionGridCalculator'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { ROW_ACTIONS } from '~/stores/jsonApi/Collection'
import InlineLoader from '~/ui/layout/InlineLoader'
import PlusIcon from '~/ui/icons/PlusIcon'
import CircleTrashIcon from '~/ui/icons/CircleTrashIcon'
import CircleAddRowIcon from '~/ui/icons/CircleAddRowIcon'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import FoamcoreZoomControls from '~/ui/grid/FoamcoreZoomControls'
import FoamcoreHotspot from '~/ui/grid/FoamcoreHotspot'
import CollectionViewToggle from '~/ui/grid/CollectionViewToggle'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import { objectsEqual } from '~/utils/objectUtils'

// set as a flag in case we ever want to enable this, it just makes a couple minor differences in logic
const USE_COLLISION_DETECTION_ON_DRAG = false

const CircleIconHolder = styled.button`
  border: 1px solid ${v.colors.secondaryMedium};
  border-radius: 50%;
  color: ${v.colors.secondaryMedium};
  height: 32px;
  width: 32px;
`

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

  ${CircleIconHolder} {
    display: none;
    height: 32px;
    width: 32px;
  }

  ${CircleIconHolder} + ${CircleIconHolder} {
    margin-top: 8px;
  }

  ${props =>
    props.type !== 'unrendered' &&
    `&:hover {
    background-color: ${v.colors.primaryLight} !important;

    .plus-icon {
      display: block;
    }

    ${CircleIconHolder} {
      display: block;
    }
  }
  `} .plus-icon {
    display: none;
  }
`
BlankCard.displayName = 'BlankCard'

const Grid = styled.div`
  position: relative;
  width: ${props => `${props.width}px`};
  min-height: ${props => `${props.height}px`};
`

export const StyledPlusIcon = styled.div`
  position: absolute;
  /* TODO: better styling than this? */
  width: 20%;
  height: 20%;
  top: 38%;
  left: 38%;
  color: ${v.colors.secondaryMedium};
`

const RightBlankActions = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 12px;
  top: calc(50% - 36px);
`
RightBlankActions.displayName = 'RightBlankActions'

const CollectionFilterWrapper = styled.div`
  display: flex;
  position: fixed;
  z-index: ${v.zIndex.zoomControls};
  top: ${v.headerHeight}px;
  height: 86px;
  right: 32px;
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
    const { collection } = this.props
    // return if we're still loading a new page
    if (this.loadingRow || collection.loadedRows === 0) {
      return
    }

    const { zoomLevel, maxRow } = this
    this.computeVisibleRows()
    this.computeVisibleCols()

    if (!this.showZoomControls && zoomLevel > 1) {
      this.handleZoomIn()
    }

    const visRows = this.visibleRows

    // Load more rows if currently loaded rows is less than
    // one full screen out of view
    if (collection.loadedRows < visRows.max + visRows.num) {
      runInAction(() => {
        this.loadingRow = maxRow
      })
      await this.loadMoreRows()
      runInAction(() => {
        this.loadingRow = null
      })
    }
  }

  loadMoreRows = () => {
    const { collection, loadCollectionCards } = this.props
    if (collection.isSplitLevelBottom) {
      if (collection.hasMore) {
        loadCollectionCards({ page: collection.nextPage })
      }
      return
    }

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
    const visRows = this.visibleRows.num || 1
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

  @action
  computeVisibleRows() {
    const { pageMargins } = this
    if (!this.gridRef) return { min: null, max: null }

    const top = window.pageYOffset
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

    const left = window.pageXOffset
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
    return this.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  get selectedAreaMinX() {
    return this.props.uiStore.selectedArea.minX
  }

  handleBlankCardClick = ({ row, col, create = false }) => e => {
    const { selectedAreaMinX } = this
    const { apiStore, uiStore, collection } = this.props

    // If user is selecting an area, don't trigger blank card click
    if (selectedAreaMinX) {
      return
    }

    uiStore.openBlankContentTool({
      row,
      col,
    })

    if (create) {
      const placeholder = new CollectionCard(
        {
          row,
          col,
          parent_id: collection.id,
        },
        apiStore
      )
      placeholder.API_createBct()
    }
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
    setTimeout(() => {
      uiStore.scrollToCenter()
    }, 1)
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

    // don't close MDL when performing a resize
    this.resetCardPositions({ keepMDLOpen: true })
  }

  moveCards = async masterCard => {
    if (this.dragGridSpot.size < 1) return
    const { apiStore, uiStore, collection } = this.props
    const {
      movingFromCollectionId,
      cardAction,
      draggingFromMDL,
      movingCardsOverflow,
    } = uiStore
    // capture this as a normal array before it gets changed/observed e.g. in onConfirmOrCancel
    const multiMoveCardIds = [...uiStore.multiMoveCardIds]
    const undoMessage = 'Card move undone'

    const dragGridSpotValues = [...this.dragGridSpot.values()]
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
    if (objectsEqual(masterPosition, this.draggingCardMasterPosition)) {
      return
    }

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
        this.dragGridSpot.clear()
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
    const { collection } = this.props
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
      this.dragGridSpot.set(getMapKey(position), position)
      this.hasDragCollision =
        this.hasDragCollision || this.findOverlap(position)
      return {}
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
    const { canEditCollection, collection } = this.props
    const { pageMargins, zoomLevel, relativeZoomLevel } = this
    const cardType = card.record ? card.record.internalType : card.cardType

    const position = this.positionForCoordinates(card)

    if (card.id === 'blank' && zoomLevel !== 1) {
      // TODO: on fourWide these numbers are not perfect... figure out better calculation?
      const xShift = collection.isFourWideBoard ? 20 : 38
      const yShift = collection.isFourWideBoard ? 16 : 30
      position.xPos = position.x - zoomLevel * xShift
      position.yPos = position.y - zoomLevel * yShift
    }

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

  renderRightBlankActions(row) {
    return (
      <RightBlankActions>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Remove row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => this.handleRemoveRowClick(ev, row)}>
            <CircleTrashIcon />
          </CircleIconHolder>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Add row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => this.handleInsertRowClick(ev, row)}>
            <CircleAddRowIcon />
          </CircleIconHolder>
        </Tooltip>
      </RightBlankActions>
    )
  }

  positionBlank({ row, col, width, height }, type = 'drag') {
    const position = this.positionForCoordinates({ col, row, width, height })
    const {
      collection,
      collection: { collection_cards },
    } = this.props
    const { num_columns } = collection

    const { relativeZoomLevel } = this
    let inner = ''
    const emptyRow =
      !_.some(collection_cards, { row }) &&
      !_.some(collection_cards, { row: row - 1, height: 2 })

    if (type === 'hover') {
      inner = (
        <div
          style={{ position: 'relative', height: '100%' }}
          data-empty-space-click
        >
          <StyledPlusIcon className="plus-icon">
            <PlusIcon />
          </StyledPlusIcon>
          {num_columns === 4 && emptyRow && this.renderRightBlankActions(row)}
        </div>
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
        // this is to make it work the same as CollectionGrid BCT for cypress
        className={`StyledHotspot-${row}:${col}-BCT`}
        data-empty-space-click
        draggedOn
      >
        {inner}
      </BlankCard>
    )
  }

  positionBct({ col = 0, row = 0, width, height, blankType }) {
    // TODO this has to be documented
    const blankContentTool = {
      id: 'blank',
      num: 0,
      cardType: 'blank',
      blankType,
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
    let extraRows = 0
    if (collection.isSplitLevel) {
      extraRows = 1
    } else {
      extraRows = this.visibleRows.num * 2
    }
    _.each(_.range(0, collection.max_row_index + extraRows), row => {
      _.each(_.range(0, collection.num_columns), col => {
        // If there's no row, or nothing in this column, add a blank card for this spot
        const blankCard = { row, col, width: 1, height: 1 }
        if (!cardMatrix[row] || !cardMatrix[row][col]) {
          if (this.cardWithinViewPlusPage(blankCard)) {
            blankCards.push(this.positionBlank(blankCard, 'hover'))
          }
        }
      })
    })
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
    const { movingCardsOverflow } = this.props.uiStore

    const draggingPlaceholders = [...this.dragGridSpot.values()]
    const maxRowCard = _.maxBy(draggingPlaceholders, 'row')
    const maxRow = maxRowCard && maxRowCard.row
    return _.map(draggingPlaceholders, placeholder => {
      placeholder.id = 'drag'
      const atMaxRow =
        placeholder.row === maxRow ||
        placeholder.row + placeholder.height - 1 === maxRow
      if (movingCardsOverflow && atMaxRow) {
        placeholder.id = 'drag-overflow'
      }
      return this.positionBlank(placeholder, placeholder.id)
    })
  }

  renderBlanksAndBct() {
    const { collection, uiStore, canEditCollection } = this.props
    const { selectedAreaMinX } = this
    const { num_columns } = collection
    const { blankContentToolState, blankContentToolIsOpen } = uiStore

    // if we're dragging the selection square, don't bother rendering blanks
    if (selectedAreaMinX || this.dragging) {
      return null
    }

    let cards = []
    const leftPad = num_columns > 4 ? 3 : 0
    const topPad = num_columns > 4 ? 3 : 1
    const across = _.min([10, num_columns])
    if (this.loadingRow) {
      _.times(across, i => {
        _.times(4, j => {
          cards.push({
            id: 'unrendered',
            // loading squares are centered, 3 from the left
            col: i + leftPad,
            // down from the beginning of loadingRow by topPad rows
            row: this.loadingRow + j + topPad,
            width: 1,
            height: 1,
          })
        })
      })
    }

    if (
      blankContentToolIsOpen &&
      blankContentToolState.collectionId === collection.id
    ) {
      cards.push({
        id: 'blank',
        blankType: 'bct',
        ...blankContentToolState,
      })
    }

    if (canEditCollection && this.placeholderSpot) {
      cards.push({
        id: 'resize',
        ...this.placeholderSpot,
      })
    }

    cards = _.map(cards, this.renderCard)

    if (canEditCollection && !this.dragging) {
      // Add blank cards for all empty spaces - for hover and click -> BCT actions
      // NOTE: this may be a factor in more re-renders as it will update as you scroll
      cards = [...cards, ...this.blankCardsForEmptySpacesWithinVisibleArea]
    }

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
      position: this.positionForCoordinates(movingCard),
    }
    const placeholder = new CollectionCard(data, apiStore)
    apiStore.updateModelId(placeholder, `${movingCard.id}-mdlPlaceholder`)

    return this.renderCard(placeholder)
  }

  renderHotspots() {
    const { collection, canEditCollection } = this.props
    if (!canEditCollection) {
      return
    }

    const { cardMatrix, num_columns, isFourWideBoard } = collection
    const { relativeZoomLevel } = this
    // rows start at 0, plus add an extra at the bottom
    const maxRow = this.maxRow + 1

    const hotEdges = []
    _.each(_.range(0, maxRow), row => {
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
            <FoamcoreHotspot
              key={`hotspot-${row}:${col}`}
              relativeZoomLevel={relativeZoomLevel}
              row={row}
              col={col}
              horizontal={false}
              onClick={this.handleBlankCardClick({ col, row, create: true })}
            />
          )
        }
      })

      if (isFourWideBoard) {
        // only 4WFC has horizontal hot edges in the row gutters
        hotEdges.push(
          <FoamcoreHotspot
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

  render() {
    const { collection } = this.props
    const { isSplitLevelBottom } = collection

    const gridSize = this.totalGridSize
    return (
      <Grid
        className={`foamcoreGridBoundary${isSplitLevelBottom ? '-bottom' : ''}`}
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
        {!isSplitLevelBottom && collection.showFilters && (
          <CollectionFilterWrapper>
            <CollectionViewToggle collection={collection} />
            <CollectionFilter
              collection={collection}
              canEdit={collection.canEdit}
            />
          </CollectionFilterWrapper>
        )}
        {this.renderDragSpots()}
        {this.renderBlanksAndBct()}
        {this.renderAddSubmission()}
        {this.renderMdlPlaceholder()}
        {this.renderHotspots()}
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
  blankContentToolState: {},
  sorting: false,
  cardIdMenuOpen: null,
  submissionSettings: null,
}
FoamcoreGrid.displayName = 'FoamcoreGrid'

export default FoamcoreGrid
