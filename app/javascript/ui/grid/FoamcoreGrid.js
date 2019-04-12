import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import MovableGridCard from '~/ui/grid/MovableGridCard'
import v from '~/utils/variables'

// When you have attributes that will change a lot,
// it's a performance gain to use `styled.div.attrs`
const BlankCard = styled.div.attrs({
  style: ({ x, y, h, w, zoomLevel, draggedOn }) => ({
    height: `${h}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `scale(${1 / zoomLevel})`,
    width: `${w}px`,
  }),
})`
  border: ${props =>
    props.type === 'unrendered' ? `1px solid ${v.colors.primaryDark}` : 'none'};
  background-color: ${props => {
    if (props.blocked) {
      return v.colors.alert
    }
    if (
      props.type === 'blank' ||
      props.type === 'drag' ||
      props.type === 'hover'
    ) {
      return v.colors.primaryLight
    }
    return 'none'
  }};
  position: absolute;
  transform-origin: left top;
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
  }
  opacity: ${props => (props.type === 'drag' ? 0.5 : 1)};
  z-index: ${props => (props.type === 'drag' ? v.zIndex.cardHovering : 0)};
`

const Grid = styled.div`
  min-height: 1300px;
  margin-top: ${v.pageContentMarginTop}px;
  position: relative;
`

function getMapKey({ col, row }) {
  return `${col},${row}`
}

const pageMargins = {
  // v.containerPadding is in `em` units, so we multiply by 16
  left: v.containerPadding.horizontal * 16,
  top: v.headerHeight + 90,
}

const MAX_CARD_W = 4
const MAX_CARD_H = 2

// needs to be an observer to observe changes to the collection + items
@inject('apiStore', 'routingStore', 'uiStore')
@observer
class FoamcoreGrid extends React.Component {
  gridRef = null
  filledSpots = []
  @observable
  cardsToRender = []
  @observable
  zoomLevel = 1
  dragGridSpot = observable.map({})
  @observable
  dragging = false
  @observable
  resizing = false
  // TODO rename this now that it's also used for resize placeholder
  @observable
  placeholderSpot = {
    row: null,
    col: null,
    width: null,
    height: null,
    type: null,
  }
  loadedRows = { loading: false, max: 0 }
  loadedCols = { loading: false, max: 0 }
  draggingMap = []
  // track whether drag movement is blocked because of overlapping cards
  hasDragCollision = false

  constructor(props) {
    super(props)
    this.debouncedSetDraggedOnSpots = _.debounce(this.setDraggedOnSpots, 15)
    this.throttledSetHoverSpot = _.throttle(this.setHoverSpot, 50)
    this.throttledSetResizeSpot = _.throttle(this.setResizeSpot, 25)
    this.throttledLoadAfterScroll = _.debounce(this.loadAfterScroll, 250)
    this.throttledCalculateCardsToRender = _.throttle(
      this.calculateCardsToRender,
      25
    )
  }

  componentDidMount() {
    this.filledSpots = this.calculateFilledSpots()
    this.throttledCalculateCardsToRender()
    window.addEventListener('scroll', this.handleScroll)
  }

  componentDidUpdate() {
    this.filledSpots = this.calculateFilledSpots()
  }

  componentWillUnmount() {
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

  get cardAndGutterWidth() {
    const { gridW, gutter } = this.props
    return (gridW + gutter) / this.zoomLevel
  }

  get cardAndGutterHeight() {
    const { gridH, gutter } = this.props
    return (gridH + gutter) / this.zoomLevel
  }

  get visibleRows() {
    if (!this.gridRef) return { min: null, max: null }

    const top = window.scrollY
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

    const left = window.scrollX
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
    const { gridW, gridH, gutter } = this.props
    const { zoomLevel } = this

    const colAmountLeft = x % (gridW + gutter)
    const rowAmountLeft = y % (gridH + gutter)

    // If in the gutter, return null
    if (colAmountLeft > gridW || rowAmountLeft > gridH) return null

    const col = Math.floor((x / (gridW + gutter)) * zoomLevel)
    const row = Math.floor((y / (gridH + gutter)) * zoomLevel)

    if (row === -1 || col === -1) return null

    return { col, row }
  }

  positionForCoordinates({ col, row, width = 1, height = 1 }) {
    const { gridW, gridH, gutter } = this.props
    const { zoomLevel } = this
    const pos = {
      x: (col * (gridW + gutter)) / zoomLevel,
      y: (row * (gridH + gutter)) / zoomLevel,
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

  findCardOverlap(card) {
    const { uiStore } = this.props
    let { width, height } = card
    const origWidth = width
    const { row, col } = card
    let found = false
    while (height > 0 && !found) {
      while (width > 0 && !found) {
        const filledRow = row + height - 1
        const filledCol = col + width - 1
        const searchRow = this.filledSpots[filledRow]
        found = searchRow && searchRow[filledCol]
        // don't consider overlapping itself
        if (found && _.includes(uiStore.multiMoveCardIds, found.id))
          found = false
        width -= 1
      }
      width = origWidth
      height -= 1
    }
    return found
  }

  getDraggedOnSpot(coords) {
    return this.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  handleBlankCardClick = ({ row, col }) => e => {
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
    this.throttledCalculateCardsToRender()
  }

  handleZoomIn = ev => {
    if (this.zoomLevel === 1) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel - 1
    })
    this.throttledCalculateCardsToRender()
  }

  handleMouseMove = ev => {
    // Something about react synthetic events and throttling
    ev.persist()
    if (this.resizing) return
    const hoverPos = {
      x: ev.pageX - pageMargins.left,
      y: ev.pageY - pageMargins.top,
    }
    this.throttledSetHoverSpot(hoverPos)
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
  }

  onDragOrResizeStop = (cardId, dragType) => {
    const {
      collection: { collection_cards },
      uiStore,
    } = this.props
    uiStore.stopDragging()
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
    if (height > MAX_CARD_H) height = MAX_CARD_H
    if (width > MAX_CARD_W) width = MAX_CARD_W
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
    const { collection } = this.props
    const undoMessage = 'Card move undone'

    const movePlaceholder = [...this.dragGridSpot.values()][0]
    const masterRow = movePlaceholder.row
    const masterCol = movePlaceholder.col

    if (
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
    //
    // TODO: currently it can set negative rows and columns
    // if you move to the left-hand side of the board,
    // so we need to address that in collision detection
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

  // reset the grid back to its original state
  resetCardPositions() {
    const { uiStore } = this.props
    runInAction(() => {
      this.dragGridSpot.clear()
      this.dragging = false
      this.resizing = false
      uiStore.multiMoveCardIds = []
    })
    // Run immediately without throttling
    this.calculateCardsToRender()
  }

  /*
   * Sets the current spots that are being dragged on, whether it's a card
   * or a blank spot that then has to be rendered
   */
  setDraggedOnSpots(overlapCoords, dragPosition, recur) {
    if (!this.dragging) return
    if (!recur) {
      runInAction(() => {
        this.dragGridSpot.clear()
      })
    }
    const { uiStore } = this.props
    if (!overlapCoords) {
      return
    }

    runInAction(() => {
      this.dragGridSpot.set(getMapKey(overlapCoords), overlapCoords)
    })
    if (uiStore.multiMoveCardIds.length > 1 && !recur) {
      this.setMultiMoveDragSpots(overlapCoords, dragPosition)
    }
    this.calculateCardsToRender()
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

  setHoverSpot(hoverPos) {
    if (this.resizing) return
    const coordinates = this.coordinatesForPosition(hoverPos)
    if (coordinates) {
      // Don't place a hover card when there's already a card there.
      const found = this.findFilledSpot(coordinates)
      if (found && this.placeholderSpot) {
        this.setPlaceholderSpot({})
      } else {
        this.setPlaceholderSpot({ ...coordinates, type: 'hover' })
      }
    } else {
      this.setPlaceholderSpot({})
    }
    this.throttledCalculateCardsToRender()
  }

  setResizeSpot({ row, col, width, height }) {
    this.setPlaceholderSpot({
      row,
      col,
      width,
      height,
      type: 'resize',
    })
    this.throttledCalculateCardsToRender()
  }

  calculateFilledSpots() {
    const {
      collection: { collection_cards },
    } = this.props

    const filledSpots = []
    collection_cards.forEach(card => {
      let { width, height } = card
      const origWidth = width
      const { row, col } = card
      while (height > 0) {
        while (width > 0) {
          const filledRow = row + height - 1
          const filledCol = col + width - 1
          //   row: row + height - 1, // 1 + 2 - 1 = 2 | 2
          //   col: col + width - 1, // 0 + 2 - 1 = 1 | 0
          filledSpots[filledRow] = filledSpots[filledRow] || []
          filledSpots[filledRow][filledCol] = card
          width -= 1
        }
        width = origWidth
        height -= 1
      }
    })
    return filledSpots
  }

  findFilledSpot({ col, row }, cardId = null) {
    if (!_.isNumber(col) || _.isNaN(col)) return null
    const { uiStore } = this.props
    const filledRow = this.filledSpots[row]
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

  calcEdgeCol({ col, row, width }, cardId) {
    let tempCol = col + width - 1
    while (tempCol <= col + MAX_CARD_W) {
      const filled = this.findFilledSpot({ col: tempCol, row }, cardId)
      if (filled) {
        return tempCol - col
      }
      tempCol += 1
    }
    return MAX_CARD_W
  }

  calcEdgeRow({ col, row, height }, cardId) {
    let tempRow = row + height - 1
    while (tempRow <= MAX_CARD_H) {
      const filled = this.findFilledSpot({ row: tempRow, col }, cardId)
      if (filled) {
        return tempRow - row
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
      position.yPos = position.y - this.zoomLevel * 38
    }

    return (
      <MovableGridCard
        key={key}
        card={card}
        cardType={cardType}
        canEditCollection={canEditCollection}
        isUserCollection={collection.isUserCollection}
        isSharedCollection={collection.isSharedCollection}
        position={position}
        record={card.record || {}}
        onDrag={this.onDrag}
        onDragStart={this.onDragStart}
        // no need to trigger displacing the card (hoveringOverLeft) since we don't do that in foamcore
        hoveringOverLeft={false}
        hoveringOverRight={!!opts.hoverOverRight}
        holdingOver={!!card.holdingOver}
        onDragOrResizeStop={this.onDragOrResizeStop}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        routeTo={routingStore.routeTo}
        parent={collection}
        menuOpen={cardMenuOpen.id === card.id}
        zoomLevel={this.zoomLevel}
        maxResizeCol={this.calcEdgeCol(card, card.id)}
        maxResizeRow={this.calcEdgeRow(card, card.id)}
        horizontalScroll
        showHotEdge={false}
      />
    )
  }

  positionBlank({ row, col, width, height }, type = 'generic') {
    const position = this.positionForCoordinates({ col, row, width, height })

    const { zoomLevel } = this

    return (
      <BlankCard
        onClick={this.handleBlankCardClick({ col, row })}
        {...position}
        type={type}
        zoomLevel={zoomLevel}
        key={`blank-${type}-${row}:${col}`}
        blocked={this.hasDragCollision && type === 'drag'}
        data-blank-type={type}
        draggedOn
      />
    )
  }

  positionBct({ col, row }) {
    // TODO this has to be documented
    const blankContentTool = {
      id: 'blank',
      num: 0,
      cardType: 'blank',
      blankType: null,
      col,
      row,
      width: 1,
      height: 1,
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
  setPlaceholderSpot = placeholderSpot => {
    this.placeholderSpot = placeholderSpot
  }

  @action
  calculateCardsToRender = () => {
    const { collection, uiStore } = this.props
    const collectionCards = [...collection.collection_cards]
    let cards = []

    collectionCards.forEach(card => {
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

    if (uiStore.blankContentToolState)
      cards.push({
        id: 'blank',
        blankType: 'bct',
        ...uiStore.blankContentToolState,
      })
    if (this.dragGridSpot.size)
      cards = [...cards, ...this.dragGridSpot.values()]

    // Don't render cards that are being dragged along
    cards = cards.filter(
      card =>
        !card.isBeingMultiDragged &&
        _.isNumber(card.row) &&
        _.isNumber(card.col)
    )
    this.hasDragCollision = false
    cards = cards.map(cardOrBlank => {
      // If another real card is filling up the hover spot, don't render
      // the hover spot at all (which gets rendered after this loop)
      if (cardOrBlank.id === 'blank') {
        return this.positionBct(cardOrBlank)
      } else if (cardOrBlank.id === 'unrendered') {
        return this.positionBlank(cardOrBlank, 'unrendered')
      } else if (cardOrBlank.id) {
        return this.positionCard(cardOrBlank)
      }
      // for the blank dragging spots determine if they are blocked for moving into
      this.hasDragCollision =
        this.hasDragCollision || this.findCardOverlap(cardOrBlank)
      return this.positionBlank(cardOrBlank, 'drag')
    })
    cards.push(
      this.positionBlank(this.placeholderSpot, this.placeholderSpot.type)
    )

    this.cardsToRender = cards
    return this.cardsToRender
  }

  render() {
    const { gridW } = this.props

    return (
      <Grid
        data-deselect-on-click
        onMouseMove={this.handleMouseMove}
        onScroll={this.handleScroll}
        innerRef={ref => {
          this.gridRef = ref
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 900,
            background: 'white',
          }}
        >
          <button onClick={this.handleZoomOut}>
            <h3>-</h3>
          </button>
          <span style={{ display: 'inline-block', width: '10px' }} />
          <button onClick={this.handleZoomIn}>
            <h3>+</h3>
          </button>
        </div>
        <div style={{ width: `${gridW * 16}px`, height: '1px' }} />
        {this.cardsToRender}
      </Grid>
    )
  }
}

const gridConfigProps = {
  cols: PropTypes.number.isRequired,
  gridH: PropTypes.number.isRequired,
  gridW: PropTypes.number.isRequired,
  gutter: PropTypes.number.isRequired,
}

FoamcoreGrid.propTypes = {
  ...gridConfigProps,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  cardProperties: MobxPropTypes.arrayOrObservableArray.isRequired,
  trackCollectionUpdated: PropTypes.func.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  movingCardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  loadCollectionCards: PropTypes.func.isRequired,
  sorting: PropTypes.bool,
}
FoamcoreGrid.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
FoamcoreGrid.defaultProps = {
  sorting: false,
}
FoamcoreGrid.displayName = 'FoamcoreGrid'

export default FoamcoreGrid
