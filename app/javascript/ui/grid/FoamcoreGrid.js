import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import InlineLoader from '~/ui/layout/InlineLoader'
import PlusIcon from '~/ui/icons/PlusIcon'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import FoamcoreZoomControls from '~/ui/grid/FoamcoreZoomControls'
import v from '~/utils/variables'
import { objectsEqual } from '~/utils/objectUtils'

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
  background-color: ${props => {
    if (props.blocked) {
      return v.colors.alert
    }
    if (props.type === 'unrendered') {
      return v.colors.commonLightest
    }
    if (_.includes(['blank', 'drag', 'resize'], props.type)) {
      return v.colors.primaryLight
    }
    return 'none'
  }};
  position: absolute;
  transform-origin: left top;
  opacity: ${props => {
    if (props.type === 'unrendered') return 0.75
    if (props.type === 'drag') return 0.5
    return 1
  }};
  z-index: ${props => (props.type === 'drag' ? v.zIndex.cardHovering : 0)};
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

const pageMargins = {
  // v.containerPadding is in `em` units, so we multiply by 16
  left: v.containerPadding.horizontal * 16,
  // TODO: is this right? This is 60px but we also have collection title up top
  top: v.headerHeight + 90,
}

const MAX_CARD_W = 4
const MAX_CARD_H = 2
const MAX_COLS = 16

// needs to be an observer to observe changes to the collection + items
@inject('apiStore', 'routingStore', 'uiStore')
@observer
class FoamcoreGrid extends React.Component {
  gridRef = null
  @observable
  cardsToRender = []
  @observable
  zoomLevel = 3
  dragGridSpot = observable.map({})
  @observable
  dragging = false
  @observable
  resizing = false
  placeholderDefaults = {
    row: null,
    col: null,
    width: null,
    height: null,
    type: null,
  }
  draggingCardMasterPosition = {}
  // TODO rename this now that it's also used for resize placeholder
  @observable
  placeholderSpot = { ...this.placeholderDefaults }
  loadedRows = { loading: false, max: 0 }
  loadedCols = { loading: false, max: 0 }
  draggingMap = []
  // track whether drag movement is blocked because of overlapping cards
  hasDragCollision = false
  hoveringOver = false
  dragTimeoutId = null

  constructor(props) {
    super(props)
    this.debouncedSetDraggedOnSpots = _.debounce(this.setDraggedOnSpots, 15)
    this.throttledSetResizeSpot = _.throttle(this.setResizeSpot, 25)
    this.throttledLoadAfterScroll = _.debounce(this.loadAfterScroll, 250)
    this.throttledCalculateCardsToRender = _.throttle(
      this.calculateCardsToRender,
      25
    )
  }

  componentDidMount() {
    const { uiStore } = this.props
    runInAction(() => {
      uiStore.selectedAreaEnabled = true
    })
    // now that component is mounted, calculate visible area and calculateCardsToRender
    this.loadAfterScroll()
    this.updateCollectionScrollBottom()
    window.addEventListener('scroll', this.handleScroll)
  }

  componentDidUpdate(prevProps) {
    this.updateSelectedArea()
    if (this.propsHaveChangedFrom(prevProps)) {
      this.throttledCalculateCardsToRender()
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

  loadCards({ rows, cols }) {
    const { loadCollectionCards } = this.props
    // Track what we've loaded
    // Set these immediately so further calls won't load the same rows
    this.updateMaxLoaded({ row: rows[1], col: cols[1] })
    loadCollectionCards({
      rows,
      cols,
    })
  }

  propsHaveChangedFrom(prevProps) {
    const fields = [
      'cardProperties',
      'blankContentToolState',
      'cardIdMenuOpen',
      'movingCardIds',
    ]
    return !objectsEqual(_.pick(prevProps, fields), _.pick(this.props, fields))
  }

  // Load more cards if we are approaching a boundary of what we have loaded

  loadAfterScroll = ev => {
    // Run position cards to re-render cards that were previously out of view
    this.throttledCalculateCardsToRender()

    const visRows = this.visibleRows
    const visCols = this.visibleCols

    // Load more rows if currently loaded rows is less than
    // one full screen out of view
    if (this.loadedRows.max < visRows.max + visRows.num) {
      this.loadMoreRows()
    }

    // Load more columns if currently loaded columns is less than
    // one full screen out of view
    if (this.loadedCols.max < visCols.max + visCols.num) {
      this.loadMoreColumns()
    }
  }

  loadMoreRows = () => {
    const { collection } = this.props
    const visRows = this.visibleRows
    const visCols = this.visibleCols
    const collectionMaxRow = collection.max_row_index
    const loadMinRow = this.loadedRows.max + 1
    let loadMaxRow = Math.ceil(loadMinRow + visRows.num)

    // Constrain max row to maximum on collection
    if (loadMaxRow > collectionMaxRow) loadMaxRow = collectionMaxRow

    let loadMinCol = Math.ceil(visCols.min - visCols.num)
    if (loadMinCol < 0) loadMinCol = 0
    const loadMaxCol = loadMinCol + Math.ceil(visCols.num) * 2

    if (loadMinRow < loadMaxRow) {
      this.loadCards({
        cols: [loadMinCol, loadMaxCol],
        rows: [loadMinRow, loadMaxRow],
      })
    }
  }

  loadMoreColumns = () => {
    const { collection } = this.props
    const visRows = this.visibleRows
    const visCols = this.visibleCols
    const collectionMaxCol = collection.max_col_index

    const loadMinCol = this.loadedCols.max + 1
    let loadMaxCol = loadMinCol + Math.ceil(visCols.num)

    // Constrain max col to maximum on collection
    if (loadMaxCol > collectionMaxCol) loadMaxCol = collectionMaxCol

    let loadMinRow = Math.ceil(visRows.min - visRows.num)
    if (loadMinRow < 0) loadMinRow = 0
    const loadMaxRow = loadMinRow + Math.ceil(visRows.num) * 2

    if (loadMinCol < loadMaxCol) {
      this.loadCards({
        rows: [loadMinRow, loadMaxRow],
        cols: [loadMinCol, loadMaxCol],
      })
    }
  }

  updateMaxLoaded = ({ row, col }) => {
    if (row > this.loadedRows.max) this.loadedRows.max = row
    if (col > this.loadedCols.max) this.loadedCols.max = col
  }

  // Default zoom level is that which fits all columns in the browser viewport
  get relativeZoomLevel() {
    if (this.zoomLevel !== 3) return this.zoomLevel
    const { gridW, gutter } = this.gridSettings
    const gridWidth =
      (gridW + gutter) * MAX_COLS + pageMargins.left * 2 * this.zoomLevel
    return gridWidth / window.innerWidth
  }

  get gridSettings() {
    // Foamcore doesn't change gridSettings based on browser size,
    // instead always refer to the defaults
    return v.defaultGridSettings
  }

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
    const width = ((gridW + gutter) * MAX_COLS) / this.relativeZoomLevel
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

  get visibleRows() {
    if (!this.gridRef) return { min: null, max: null }

    const top = window.scrollY || window.pageYOffset
    const gridHeight = window.innerHeight - pageMargins.top

    const min = parseFloat((top / this.cardAndGutterHeight).toFixed(1))
    const max = parseFloat(
      ((top + gridHeight) / this.cardAndGutterHeight).toFixed(1)
    )
    const num = max - min

    return {
      min,
      max,
      num,
    }
  }

  get visibleCols() {
    if (!this.gridRef) return { min: null, max: null }

    const left = window.scrollX || window.pageXOffset
    const gridWidth = window.innerWidth - pageMargins.left

    const min = parseFloat((left / this.cardAndGutterWidth).toFixed(1))
    const max = parseFloat(
      ((left + gridWidth) / this.cardAndGutterWidth).toFixed(1)
    )
    const num = max - min

    return {
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

    if (row === -1 || col === -1) return null

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

  // I think we need to revise this since we aren't getting the red areas anymore
  // Or maybe it is some other attribute? Can't recall
  findCardOverlap(card) {
    const { collection, uiStore } = this.props
    const { row, col, height, width } = card
    let found = false
    let h = 1
    let w = 1
    const { cardMatrix } = collection
    while (h <= height && !found) {
      while (w <= width && !found) {
        const filledRow = row + h - 1
        const filledCol = col + w - 1
        const searchRow = cardMatrix[filledRow]
        found = searchRow && searchRow[filledCol]
        // don't consider overlapping itself
        if (found && !_.includes(uiStore.multiMoveCardIds, found.id)) {
          return {
            card: found,
            record: found.record,
            holdingOver: false,
          }
        }
        found = false

        w += 1
      }
      w = 1
      h += 1
    }
    return found
  }

  getDraggedOnSpot(coords) {
    return this.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  get isSelectingArea() {
    // Check if there is a selected area
    return !!this.selectedAreaAdjustedForGrid.minX
  }

  // Adjusts global x,y coords to foamcore grid coords
  get selectedAreaAdjustedForGrid() {
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

    const selectedCardIds = collection.cardIdsWithinRectangle(
      topLeftCoords,
      bottomRightCoords
    )

    // TODO: if shift is also selected, add to any existing selection
    runInAction(() => {
      uiStore.selectedCardIds = selectedCardIds
    })
  }

  handleBlankCardClick = ({ row, col }) => e => {
    const {
      selectedArea: { minX },
    } = this.props

    // If user is selecting an area, don't trigger blank card click
    if (minX) return

    const { uiStore } = this.props
    uiStore.openBlankContentTool({
      row,
      col,
    })

    this.throttledCalculateCardsToRender()
  }

  handleZoomOut = ev => {
    if (this.zoomLevel === 3) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel + 1
    })
    this.updateCollectionScrollBottom()
    this.throttledCalculateCardsToRender()
  }

  handleZoomIn = ev => {
    if (this.zoomLevel === 1) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel - 1
    })
    this.updateCollectionScrollBottom()
    this.throttledCalculateCardsToRender()
  }

  updateCollectionScrollBottom() {
    const { collection } = this.props
    const { gridH, gutter } = this.gridSettings
    const y =
      (collection.max_row_index * (gridH + gutter)) / this.relativeZoomLevel
    collection.updateScrollBottom(y)
  }

  handleScroll = ev => {
    this.throttledLoadAfterScroll(ev)
  }

  onDrag = (cardId, dragPosition) => {
    runInAction(() => {
      this.dragging = true
    })
    const {
      collection: { collection_cards },
    } = this.props
    const card = _.find(collection_cards, { id: cardId })
    // TODO considering changing dragX in MoveableGridCard
    const cardPosition = {
      x: dragPosition.dragX,
      y: dragPosition.dragY,
      width: card.width,
      height: card.height,
    }
    const cardDims = { width: card.width, height: card.height }
    const cardCoords = this.coordinatesForPosition(cardPosition)
    this.debouncedSetDraggedOnSpots(
      { ...cardCoords, ...cardDims },
      dragPosition
    )
  }

  onDragStart = cardId => {
    this.draggingMap = this.determineDragMap(cardId)
    this.throttledCalculateCardsToRender()
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

  moveCards = masterCard => {
    if (this.dragGridSpot.size < 1) return
    const { uiStore, collection } = this.props
    const undoMessage = 'Card move undone'

    const movePlaceholder = [...this.dragGridSpot.values()][0]
    const masterRow = movePlaceholder.row
    const masterCol = movePlaceholder.col
    // This is for dragging onto the breadcrumb
    if (uiStore.activeDragTarget) {
      const { apiStore } = this.props
      const targetRecord = uiStore.activeDragTarget.item
      if (uiStore.activeDragTarget.item.id === 'homepage') {
        targetRecord.id = apiStore.currentUserCollectionId
      }
      uiStore.setMovingCards(uiStore.multiMoveCardIds, {
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
      movePlaceholder.card ||
      this.hasDragCollision ||
      // movePlaceholder won't have row/col keys if it's not being rendered)
      typeof masterRow === 'undefined'
    ) {
      // this means you tried to drop it over an existing card (or there was no placeholder i.e. you dragged offscreen)
      this.resetCardPositions()
      return
    }

    const updates = []
    // draggingMap has the relative row and column of all cards being moved
    let negativeZone = false
    _.each(this.draggingMap, map => {
      const update = {
        card: map.card,
        row: map.row + masterRow,
        col: map.col + masterCol,
      }
      updates.push(update)

      const { row, col } = update
      if (row < 0 || col < 0) {
        negativeZone = true
        return false
      }
      return update
    })

    if (negativeZone) {
      this.resetCardPositions()
      return
    }

    const onConfirmOrCancel = () => {
      this.resetCardPositions()
    }

    collection.API_batchUpdateCardsWithUndo({
      updates,
      undoMessage,
      onConfirm: onConfirmOrCancel,
      onCancel: onConfirmOrCancel,
    })
  }

  async moveCardsIntoCollection(cardIds, hoveringRecord) {
    const afterCancelOrSuccess = () => {
      this.hoveringOver = false
      // Call so it resets moving / doesn't look like drag collision
      this.resetCardPositions()
    }
    this.props.collection.API_moveCardsIntoCollection({
      toCollection: hoveringRecord,
      cardIds,
      onCancel: afterCancelOrSuccess,
      onSuccess: () => {
        afterCancelOrSuccess()
        this.calculateCardsToRender()
      },
    })
  }

  // reset the grid back to its original state
  resetCardPositions() {
    const { uiStore } = this.props
    runInAction(() => {
      this.dragGridSpot.clear()
      this.dragging = false
      this.resizing = false
      uiStore.multiMoveCardIds = []
      this.draggingCardMasterPosition = {}
      this.setPlaceholderSpot(this.placeholderDefaults)
    })
    // Run immediately without throttling
    this.calculateCardsToRender()
  }

  /*
   * Sets the current spots that are being dragged on, whether it's a card
   * or a blank spot that then has to be rendered
   */
  @action
  setDraggedOnSpots(masterPosition, dragPosition, recur) {
    if (!this.dragging || !masterPosition) return
    const { uiStore } = this.props

    // If master dragging position hasn't changed, don't need to do anything
    if (objectsEqual(masterPosition, this.draggingCardMasterPosition)) return

    this.dragGridSpot.clear()

    // Add master dragging card
    this.dragGridSpot.set(getMapKey(masterPosition), masterPosition)

    // Loop through any additional cards and add drag spots for them
    if (uiStore.multiMoveCardIds.length > 1) {
      this.draggingMap.forEach(mapped => {
        const relativePosition = {
          col: mapped.col + masterPosition.col,
          row: mapped.row + masterPosition.row,
          width: mapped.card.width,
          height: mapped.card.height,
        }
        this.dragGridSpot.set(getMapKey(relativePosition), relativePosition)
      })
    }

    const previousHoveringOver = { ...this.hoveringOver }
    // store whatever card (or not) that we're hovering over
    this.hoveringOver = this.findCardOverlap(masterPosition)
    if (
      this.hoveringOver &&
      (!previousHoveringOver.card ||
        this.hoveringOver.card !== previousHoveringOver.card)
    ) {
      // if we've changed cards we're hovering over... start a new dragTimeout
      this.clearDragTimeout()
      const dragTimeoutId = setTimeout(() => {
        if (!this.hoveringOver) return
        this.hoveringOver.holdingOver = true
        // kind of silly but we need to call this just to get the holdingOver "jiggle" effect
        this.calculateCardsToRender()
      }, v.cardHoldTime)
      this.dragTimeoutId = dragTimeoutId
    }
    this.throttledCalculateCardsToRender()
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

  /*
   * The drag map is an array of spots that represents the positions of all
   * cards that are being dragged relative to the card actually being dragged
   *
   * Card being dragged: { col: 2, row: 1}
   * Other card dragged along: { col: 3, row: 1}
   * Drag map: [{ col: 0, row: 0}, { col: 1, row: 0}]
   */
  determineDragMap(cardId) {
    const { collection, uiStore } = this.props

    // The master card is the card currently being dragged
    const masterCard = collection.collection_cards.find(c => c.id === cardId)
    const movingCardIds = uiStore.multiMoveCardIds.filter(c => c.id !== cardId)

    // Loop through non-master cards to calculate drag map
    const dragMap = movingCardIds.map(movingCardId => {
      const card = collection.collection_cards.find(c => c.id === movingCardId)
      const { col, row } = card
      return {
        card,
        col: col - masterCard.col,
        row: row - masterCard.row,
      }
    })
    return dragMap
  }

  /*
   * This method takes a card and drag position and adds some extra data to
   * the drag spot, such as the direction, which tells what action should
   * happen when a card is being dragged on.
   */
  setCardDragSpot(card, dragPosition) {
    const { record } = card
    const { dragX } = dragPosition
    const { gridW } = this.props
    const leftAreaSize = gridW * 0.23
    const position = this.positionForCoordinates(card)
    let direction = 'left'
    if (record && record.internalType === 'collections') {
      // only collections have a "hover right" area
      direction = dragX >= position.x + leftAreaSize ? 'right' : 'left'
    }
    runInAction(() => {
      const { col, row, width } = card
      this.dragGridSpot.set(getMapKey({ row, col }), {
        col,
        row,
        width,
        direction,
        card,
      })
    })
  }

  /* This method will set the dragged-over spots for the other cards that
   * maybe are being dragged along with the one that the user is actually
   * dragging. It will only be called if multiple cards are being dragged.
   */
  setMultiMoveDragSpots(masterPosition, dragPosition) {
    this.draggingMap.forEach(mapped => {
      const relativePosition = {
        col: mapped.col + masterPosition.col,
        row: mapped.row + masterPosition.row,
        width: mapped.card.width,
        height: mapped.card.height,
      }
      this.setDraggedOnSpots(relativePosition, dragPosition, true)
    })
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
    const { col, row } = card
    const beingDraggedOnSpot =
      this.dragging && this.getDraggedOnSpot({ col, row })
    const hoverOverLeft = !!(
      beingDraggedOnSpot && beingDraggedOnSpot.direction === 'left'
    )
    const hoverOverRight = !!(
      beingDraggedOnSpot && beingDraggedOnSpot.direction === 'right'
    )

    return this.renderMovableCard(card, `card-${card.id}`, {
      hoverOverLeft,
      hoverOverRight,
    })
  }

  renderMovableCard(card, key, opts) {
    const { canEditCollection, collection, routingStore, uiStore } = this.props
    const { cardMenuOpen } = uiStore
    const cardType = card.record ? card.record.internalType : card.cardType
    const position = this.positionForCoordinates(card)

    // TODO reorganize
    if (card.id === 'blank' && this.zoomLevel !== 1) {
      position.xPos = position.x - this.zoomLevel * 38
      position.yPos = position.y - this.zoomLevel * 30
    }

    const dragOffset = {
      x: pageMargins.left,
      y: pageMargins.top,
    }

    const isHoveringOverCollection =
      this.hoveringOver &&
      this.hoveringOver.card.id === card.id &&
      this.hoveringOver.record.internalType === 'collections'

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
        // no need to trigger displacing the card (hoveringOverLeft) since we don't do that in foamcore
        hoveringOverLeft={false}
        hoveringOverRight={isHoveringOverCollection}
        holdingOver={isHoveringOverCollection && this.hoveringOver.holdingOver}
        onDragOrResizeStop={this.onDragOrResizeStop}
        onResize={this.onResize}
        routeTo={routingStore.routeTo}
        parent={collection}
        menuOpen={cardMenuOpen.id === card.id}
        zoomLevel={this.relativeZoomLevel}
        horizontalScroll
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
        // TODO: better styling than this for centering PlusIcon
        <StyledPlusIcon className="plus-icon">
          <PlusIcon />
        </StyledPlusIcon>
      )
    } else if (type === 'unrendered') {
      inner = <InlineLoader background={v.colors.commonLightest} />
    }

    return (
      <BlankCard
        onClick={this.handleBlankCardClick({ col, row })}
        {...position}
        type={type}
        zoomLevel={relativeZoomLevel}
        key={`blank-${type}-${row}:${col}`}
        /* Why is this rendering on top of a collection? */

        blocked={this.hasDragCollision && type === 'drag'}
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
    return this.renderMovableCard(blankContentTool, `bct-${col}:${row}`, {})
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
      this.calculateCardsToRender()
    }
  }

  get blankCardsForEmptySpacesWithinVisibleArea() {
    const { collection } = this.props
    const matrix = collection.cardMatrix
    const blankCards = []
    // Add blank cards to all empty spaces,
    // and 2x screen heights at the bottom
    _.each(
      _.range(0, collection.max_row_index + this.visibleRows.num * 2),
      row => {
        _.each(_.range(0, MAX_COLS), col => {
          // If there's no row, or nothing in this column, add a blank card for this spot
          const blankCard = { row, col, width: 1, height: 1 }
          if (!matrix[row] || !matrix[row][col]) {
            if (this.cardWithinViewPlusPage(blankCard))
              blankCards.push(this.positionBlank(blankCard, 'hover'))
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

  @action
  calculateCardsToRender() {
    const { collection, movingCardIds, uiStore, canEditCollection } = this.props
    // any cards that are being moved don't appear at all
    const collectionCards = _.reject(
      collection.collection_cards,
      c => _.includes(movingCardIds, c.id) || c.hidden
    )

    let cards = []
    this.hasDragCollision = false

    _.each(collectionCards, card => {
      if (this.cardWithinViewPlusPage(card) || card.isDragCardMaster) {
        // On first load we need to mark the max row and col loaded
        this.updateMaxLoaded({ row: card.row, col: card.col })
        // Render cards in view, or within one screen on any dimension
        cards.push(card)
      } else {
        // Otherwise put unrendered (outline) card in place of this card
        cards.push({
          id: 'unrendered',
          col: card.col,
          row: card.row,
          width: card.width,
          height: card.height,
        })
      }
    })

    if (uiStore.blankContentToolState) {
      cards.push({
        id: 'blank',
        blankType: 'bct',
        ...uiStore.blankContentToolState,
      })
    }

    if (this.placeholderSpot) {
      cards.push({
        id: 'resize',
        ...this.placeholderSpot,
      })
    }

    // draw our dragging grid, but only if we're not hovering over a collection
    if (this.dragGridSpot.size && !this.hoveringOverCollection) {
      // Figure out if we have a collision
      const draggingPlaceholders = [...this.dragGridSpot.values()]
      _.each(draggingPlaceholders, placeholder => {
        this.hasDragCollision =
          this.hasDragCollision || this.findCardOverlap(placeholder)
      })

      cards = [...cards, ...draggingPlaceholders]
    }

    // Don't render cards that are being dragged along
    cards = cards.filter(
      card =>
        !card.isBeingMultiDragged &&
        _.isNumber(card.row) &&
        _.isNumber(card.col)
    )
    cards = _.map(cards, cardOrBlank => {
      // If another real card is filling up the hover spot, don't render
      // the hover spot at all (which gets rendered after this loop)
      if (cardOrBlank.id === 'blank') {
        return this.positionBct(cardOrBlank)
      } else if (cardOrBlank.id === 'unrendered') {
        return this.positionBlank(cardOrBlank, 'unrendered')
      } else if (cardOrBlank.id === 'resize' || !cardOrBlank.id) {
        return this.positionBlank(cardOrBlank, cardOrBlank.id || 'drag')
      } else if (cardOrBlank.id) {
        return this.positionCard(cardOrBlank)
      }
      return null
    })

    if (canEditCollection) {
      // Add blank cards for all empty spaces - for hover and click -> BCT actions
      cards = [...cards, ...this.blankCardsForEmptySpacesWithinVisibleArea]
    }

    this.cardsToRender = cards
    return this.cardsToRender
  }

  render() {
    const gridSize = this.totalGridSize
    return (
      <Grid
        data-empty-space-click
        onScroll={this.handleScroll}
        ref={ref => {
          this.gridRef = ref
        }}
        width={gridSize.width}
        height={gridSize.height}
      >
        <FoamcoreZoomControls
          onZoomIn={this.handleZoomIn}
          onZoomOut={this.handleZoomOut}
        />
        {this.cardsToRender}
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
