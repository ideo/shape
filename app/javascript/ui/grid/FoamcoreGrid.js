import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
// import _ from 'lodash'
import styled from 'styled-components'

// import CollectionSort from '~/ui/grid/CollectionSort'
// import Loader from '~/ui/layout/Loader'
// import MovableGridCard from '~/ui/grid/MovableGridCard'
// import CollectionCard from '~/stores/jsonApi/CollectionCard'
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
  ${props =>
    props.type === 'unrendered' &&
    `border: 1px solid ${v.colors.primaryDark};`} ${props =>
    props.type === 'blank' &&
    `background-color: ${v.colors.primaryLight};`}
  position: absolute;
  transform-origin: left top;
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
  }
  z-index: 0;
`

const Grid = styled.div`
  min-height: 1300px;
  overflow-x: scroll;
  overflow-y: scroll;
  position: relative;
`

function getMapKey({ col, row }) {
  return `${col},${row}`
}

function isPointSame(first, other) {
  return first.row === other.row && first.col === other.col
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
  blankContentTool = null
  @observable
  zoomLevel = 1
  dragGridSpot = observable.map({})
  @observable
  dragging = false
  @observable
  resizing = false
  // TODO rename this now that it's also used for resize placeholder
  @observable
  placeholderSpot = { row: null, col: null, width: null, height: null }
  loadedRows = { loading: false, max: 0 }
  loadedCols = { loading: false, max: 0 }
  draggingMap = []

  constructor(props) {
    super(props)
    this.debouncedSetDraggedOnSpots = _.debounce(this.setDraggedOnSpots, 25)
    this.throttledSetHoverSpot = _.throttle(this.setHoverSpot, 50)
    this.throttledSetResizeSpot = _.throttle(this.setResizeSpot, 25)
    this.throttledLoadAfterScroll = _.debounce(this.loadAfterScroll, 250)
    this.debouncedCalculateCardsToRender = _.debounce(
      this.calculateCardsToRender,
      50
    )
  }

  componentDidMount() {
    this.filledSpots = this.calculateFilledSpots()
    this.debouncedCalculateCardsToRender()
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

    this.debouncedCalculateCardsToRender()

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

  updateCardWithUndo(card, updates, undoMessage) {
    // TODO combine with normal grid
    const { collection } = this.props
    // If a template, warn that any instances will be updated
    const updateCollectionCard = () => {
      // this will assign the update attributes to the card
      this.props.updateCollection({
        card,
        updates,
        undoMessage,
      })
    }
    collection.confirmEdit({
      onCancel: () => {},
      onConfirm: updateCollectionCard,
    })
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

  get pageMargins() {
    return {
      left: v.containerPadding.horizontal * 16 * this.zoomLevel,
      top: v.headerHeight,
    }
  }

  get visibleRows() {
    if (!this.gridRef) return { min: null, max: null }

    const top = this.gridRef.scrollTop
    const gridHeight = window.innerHeight - this.pageMargins.top

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

    const left = this.gridRef.scrollLeft
    const gridWidth = window.innerWidth - this.pageMargins.left

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

    const row = Math.floor(((y + gutter * 0.5) / (gridH + gutter)) * zoomLevel)
    const col = Math.floor(((x + gutter * 2) / (gridW + gutter)) * zoomLevel)
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
    // TODO try and get rid of {x|y}Pos
    return {
      ...pos,
      xPos: pos.x,
      yPos: pos.y,
      width: pos.w,
      height: pos.h,
    }
  }

  findCardForSpot({ col, row }) {
    const cards = this.props.collection.collection_cards
    return cards.find(card => isPointSame(card, { col, row }))
  }

  getDraggedOnSpot(coords) {
    return this.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  handleBlankCardClick = ({ row, col }) => e => {
    runInAction(() => {
      this.blankContentTool = {
        id: 'blank',
        type: 'bct',
        row,
        col,
      }
    })
    this.debouncedCalculateCardsToRender()
  }

  handleZoomOut = ev => {
    if (this.zoomLevel === 3) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel + 1
    })
    this.debouncedCalculateCardsToRender()
  }

  handleZoomIn = ev => {
    if (this.zoomLevel === 1) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel - 1
    })
    this.debouncedCalculateCardsToRender()
  }

  handleMouseMove = ev => {
    // Something about react synthetic events and throttling
    ev.persist()
    if (this.resizing) return
    const hoverPos = {
      x: ev.pageX - this.pageMargins.left + this.gridRef.scrollLeft,
      y: ev.pageY - this.pageMargins.top + this.gridRef.scrollTop,
    }
    this.throttledSetHoverSpot(hoverPos)
  }

  handleMouseOut = ev => {
    this.setPlaceholderSpot({})
    this.debouncedCalculateCardsToRender()
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
    const overlapPos = {
      x: dragPosition.dragX,
      y: dragPosition.dragY,
      width: card.width,
      height: card.height,
    }
    const cardDims = { width: card.width, height: card.height }
    const overlapCoords = this.coordinatesForPosition(overlapPos)
    this.debouncedSetDraggedOnSpots(
      { ...overlapCoords, ...cardDims },
      dragPosition
    )
  }

  onDragStart = cardId => {
    const dragMap = this.determineDragMap(cardId)
    this.draggingMap = dragMap
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
      this.moveCard(card)
    }
    runInAction(() => {
      this.dragGridSpot.clear()
      this.dragging = false
      this.resizing = false
      // TODO not sure why stopDragging doesn't clear this out
      uiStore.multiMoveCardIds = []
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
    // just some double-checking validations
    let undoMessage
    const resizePlaceholder = this.placeholderSpot
    let { height, width } = resizePlaceholder
    if (height > MAX_CARD_H) height = MAX_CARD_H
    if (width > MAX_CARD_W) width = MAX_CARD_W
    // set up action to undo
    if (card.height !== height || card.width !== width) {
      undoMessage = 'Card resize undone'
    }
    const updates = {}
    updates.width = width
    updates.height = height
    this.updateCardWithUndo(card, updates, undoMessage)
  }

  moveCard = (card, data) => {
    const { uiStore } = this.props
    const undoMessage = 'Card move undone'
    // Different paths for dragging multiple cards vs one
    if (uiStore.multiMoveCardIds.length < 2) {
      if (this.dragGridSpot.size < 1) return
      const movePlaceholder = [...this.dragGridSpot.values()][0]
      // Save algorithm for what to do when dragging over card for collision
      // resolution later
      if (movePlaceholder.card) return

      const { row, col } = movePlaceholder
      const updates = { row, col }
      this.updateCardWithUndo(card, updates, undoMessage)
      this.debouncedCalculateCardsToRender()
    }
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
    const maybeCard = this.findCardForSpot(overlapCoords)
    if (maybeCard) {
      this.setCardDragSpot(maybeCard, dragPosition)
      if (uiStore.multiMoveCardIds.length > 1 && !recur) {
        this.setMultiMoveDragSpots(overlapCoords, dragPosition)
      }
      return
    }
    runInAction(() => {
      this.dragGridSpot.set(getMapKey(overlapCoords), overlapCoords)
    })
    if (uiStore.multiMoveCardIds.length > 1 && !recur) {
      this.setMultiMoveDragSpots(overlapCoords, dragPosition)
    }
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

    if (uiStore.multiMoveCardIds.length < 2) return {}
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
      const { col, row } = card
      this.dragGridSpot.set(getMapKey({ row, col }), {
        col,
        row,
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
      }
      this.setDraggedOnSpots(relativePosition, dragPosition, true)
    })
  }

  setHoverSpot(hoverPos) {
    if (this.resizing) return
    const coordinates = this.coordinatesForPosition(hoverPos)
    if (coordinates) {
      // Don't place a hover card when there's already a card there.
      if (this.findCardForSpot(coordinates)) {
        this.setPlaceholderSpot({})
      }
      if (!this.placeholderSpot.x) {
        this.setPlaceholderSpot({ ...coordinates, type: 'hover' })
      }
    } else {
      this.setPlaceholderSpot({})
    }
    this.debouncedCalculateCardsToRender()
  }

  setResizeSpot({ row, col, width, height }) {
    this.setPlaceholderSpot({
      row,
      col,
      width,
      height,
      type: 'resize',
    })
    this.debouncedCalculateCardsToRender()
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
          filledSpots.push({
            card,
            row: row + height - 1, // 1 + 2 - 1 = 2 | 2
            col: col + width - 1, // 0 + 2 - 1 = 1 | 0
          })
          width -= 1
        }
        width = origWidth
        height -= 1
      }
    })
    return filledSpots
  }

  findFilledSpot({ col, row }, cardId) {
    return this.filledSpots.find(flsp => {
      if (flsp.card.id === cardId) return false
      return isPointSame(flsp, { col, row })
    })
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

  positionBlank({ row, col, width, height }, type = 'generic') {
    const position = this.positionForCoordinates({ col, row, width, height })
    const { zoomLevel } = this
    // TODO: removing this guard so we can use this for unrendered cards as SharedWithMeCollection
    //
    // if (this.dragging || isPointSame(this.placeholderSpot, { col, row })) {
    return (
      <BlankCard
        onClick={this.handleBlankCardClick({ col, row })}
        {...position}
        type={type}
        zoomLevel={zoomLevel}
        key={`blank-${type}-${col}:${row}`}
        data-blank-type={type}
        draggedOn
      />
    )
    // }
    // return null
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
    const { collection } = this.props
    const collectionCards = [...collection.collection_cards]
    let cards = []

    collectionCards.forEach(card => {
      if (this.cardWithinViewPlusPage(card)) {
        // On first load we need to mark the max row and col loaded
        this.updateMaxLoaded({ row: card.row, col: card.col })
        // Render cards in view, or within one screen on any dimension
        cards.push(card)
      } else {
        // Otherwise put blank card in place of this card
        cards.push({
          id: 'unrendered',
          col: card.col,
          row: card.row,
          width: card.width,
          height: card.height,
        })
      }
    })

    if (this.blankContentTool) cards.push(this.blankContentTool)
    if (this.dragGridSpot.size)
      cards = [...cards, ...this.dragGridSpot.values()]

    // Don't render cards that are being dragged along
    cards = cards.filter(
      card =>
        !card.isBeingMultiDragged &&
        _.isNumber(card.row) &&
        _.isNumber(card.col)
    )
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
      return this.positionBlank(cardOrBlank, 'drag')
    })
    cards.push(
      this.positionBlank(this.placeholderSpot, this.placeholderSpot.type)
    )

    this.cardsToRender = cards
    return this.cardsToRender
  }

  renderMovableCard(card, key, opts) {
    const { canEditCollection, collection, routingStore, uiStore } = this.props
    const { cardMenuOpen } = uiStore
    const cardType = card.record ? card.record.internalType : card.cardType
    const position = this.positionForCoordinates(card)

    return (
      <MovableGridCard
        key={key}
        card={card}
        cardType={cardType}
        canEditCollection={canEditCollection}
        isUserCollection={collection.isUserCollection}
        isSharedCollection={collection.isSharedCollection}
        position={position}
        record={card.record}
        onDrag={this.onDrag}
        onDragStart={this.onDragStart}
        hoveringOverLeft={opts.hoverOverLeft}
        hoveringOverRight={opts.hoverOverRight}
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
      />
    )
  }

  render() {
    const { gridW } = this.props
    return (
      <Grid
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
        {this.cardsToRender.map(el => el)}
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
  updateCollection: PropTypes.func.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  cardProperties: MobxPropTypes.arrayOrObservableArray.isRequired,
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
