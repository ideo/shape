import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
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
  positionedCards = []
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
    this.thottledLoadAfterScroll = _.throttle(this.loadAfterScroll, 500)
  }

  componentDidMount() {
    const maxRow = Math.ceil(this.visibleRows.max + this.visibleRows.num)
    const maxCol = Math.ceil(this.visibleCols.max + this.visibleCols.num)
    this.loadCards({
      rows: [0, maxRow],
      cols: [0, maxCol],
    })
    this.filledSpots = this.calculateFilledSpots()
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
    if (rows[1] > this.loadedRows.max) this.loadedRows.max = rows[1]
    if (cols[1] > this.loadedCols.max) this.loadedCols.max = cols[1]
    loadCollectionCards({
      rows,
      cols,
    })
  }

  loadAfterScroll = ev => {
    // Load more cards if we are approaching a boundary
    const visRows = this.visibleRows
    const visCols = this.visibleCols

    // Take current visible max row, see if that is <
    if (this.loadedRows.max < visRows.max + visRows.num) {
      // load more rows
      const loadMinRow = this.loadedRows.max
      const loadMaxRow = Math.ceil(loadMinRow + visRows.num)

      this.loadCards({
        cols: [0, this.loadedCols.max],
        rows: [loadMinRow, loadMaxRow],
      })
    }

    if (this.loadedCols.max < visCols.max + visCols.num) {
      // Load more columns
      const loadMinCol = this.loadedCols.max
      const loadMaxCol = Math.ceil(loadMinCol + visCols.num)

      this.loadCards({
        rows: [0, this.loadedRows.max],
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
  }

  handleZoomOut = ev => {
    if (this.zoomLevel === 3) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel + 1
    })
  }

  handleZoomIn = ev => {
    if (this.zoomLevel === 1) return
    runInAction(() => {
      this.zoomLevel = this.zoomLevel - 1
    })
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
    runInAction(() => {
      this.placeholderSpot = {}
    })
  }

  handleScroll = ev => {
    this.thottledLoadAfterScroll(ev)
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
      const movePlaceholder = [...this.dragGridSpot.values][0]
      // Save algorithm for what to do when dragging over card for collision
      // resolution later
      if (movePlaceholder.card) return

      const { row, col } = movePlaceholder
      const updates = { row, col }
      this.updateCardWithUndo(card, updates, undoMessage)
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
    runInAction(() => {
      if (coordinates) {
        // Don't place a hover card when there's already a card there.
        if (this.findCardForSpot(coordinates)) {
          this.placeholderSpot = {}
          return
        }
        if (!this.placeholderSpot.x) {
          this.placeholderSpot = { ...coordinates, type: 'hover' }
        }
      } else {
        this.placeholderSpot = {}
      }
    })
  }

  setResizeSpot({ row, col, width, height }) {
    runInAction(() => {
      this.placeholderSpot = {
        row,
        col,
        width,
        height,
        type: 'resize',
      }
    })
  }

  calculateFilledSpots() {
    const {
      collection: { collection_cards },
    } = this.props

    const filledSpots = []
    collection_cards.forEach(card => {
      let { width, height } = card
      const { row, col } = card
      while (height > 0) {
        while (width > 0) {
          filledSpots.push({
            card,
            row: row + height - 1,
            col: col + width - 1,
          })
          width -= 1
        }
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
    const { col, row, width, height } = card
    const { canEditCollection, collection, routingStore, uiStore } = this.props
    const position = this.positionForCoordinates(card)
    const { cardMenuOpen } = uiStore
    const { zoomLevel } = this
    const beingDraggedOnSpot =
      this.dragging && this.getDraggedOnSpot({ col, row })
    const hoverOverLeft = !!(
      beingDraggedOnSpot && beingDraggedOnSpot.direction === 'left'
    )
    const hoverOverRight = !!(
      beingDraggedOnSpot && beingDraggedOnSpot.direction === 'right'
    )

    return (
      <MovableGridCard
        key={`card-${card.id}`}
        card={card}
        cardType={card.record.internalType}
        canEditCollection={canEditCollection}
        isUserCollection={collection.isUserCollection}
        isSharedCollection={collection.isSharedCollection}
        position={position}
        record={card.record}
        onDrag={this.onDrag}
        onDragStart={this.onDragStart}
        hoveringOverLeft={hoverOverLeft}
        hoveringOverRight={hoverOverRight}
        holdingOver={!!card.holdingOver}
        onDragOrResizeStop={this.onDragOrResizeStop}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        routeTo={routingStore.routeTo}
        parent={collection}
        menuOpen={cardMenuOpen.id === card.id}
        zoomLevel={zoomLevel}
        maxResizeCol={this.calcEdgeCol({ col, row, width }, card.id)}
        maxResizeRow={this.calcEdgeRow({ col, row, height }, card.id)}
      />
    )
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
    const { canEditCollection, collection, routingStore } = this.props
    const position = this.positionForCoordinates({ col, row })
    // TODO this has to be documented
    const blankContentTool = {
      id: 'blank',
      num: 0,
      cardType: 'blank',
      blankType: null,
      width: 1,
      height: 1,
    }
    const { zoomLevel } = this
    // TODO combine this rendering of MoveableGridCard with positionCard
    return (
      <MovableGridCard
        key={`bct-${col}:${row}`}
        card={blankContentTool}
        cardType={blankContentTool.cardType}
        canEditCollection={canEditCollection}
        isUserCollection={collection.isUserCollection}
        isSharedCollection={collection.isSharedCollection}
        position={position}
        record={blankContentTool.record}
        routeTo={routingStore.routeTo}
        parent={collection}
        zoomLevel={zoomLevel}
        menuOpen={false}
        holdingOver={false}
        hoveringOverRight={false}
        hoveringOverLeft={false}
        onDragOrResizeStop={() => {}}
        onResize={() => {}}
        onDrag={() => {}}
      />
    )
  }

  cardWithinViewPlusHalfPage = card => {
    // Select all cards that are within view,
    // plus half a screen on any side
    const rows = this.visibleRows
    const cols = this.visibleCols

    const halfRows = Math.ceil(rows.num / 2)
    const halfCols = Math.ceil(cols.num / 2)

    const withinCols =
      card.col > cols.min - halfCols && card.col < cols.max + halfCols
    const withinRows =
      card.row > rows.min - halfRows && card.row < rows.max + halfRows

    return withinRows && withinCols
  }

  cardsToLayout = () => {
    const { collection } = this.props
    const cards = [...collection.collection_cards]
    const displayCards = []

    cards.forEach(card => {
      if (this.cardWithinViewPlusHalfPage(card)) {
        // Render cards in view, or within half screen
        displayCards.push(card)
      } else {
        // Otherwise put blank card in place of this card
        displayCards.push({
          id: 'unrendered',
          col: card.col,
          row: card.row,
          width: card.width,
          height: card.height,
        })
      }
    })

    return displayCards
  }

  positionCards() {
    let allCardsToLayout = this.cardsToLayout()
    if (this.blankContentTool) allCardsToLayout.push(this.blankContentTool)
    if (this.dragGridSpot.size)
      allCardsToLayout = [...allCardsToLayout, ...this.dragGridSpot.values()]

    // Don't render cards that are being dragged along
    // Or more than one 'page' out of view
    allCardsToLayout = allCardsToLayout.filter(
      card =>
        !card.isBeingMultiDragged &&
        _.isNumber(card.row) &&
        _.isNumber(card.col)
    )
    const cardElements = allCardsToLayout.map(cardOrBlank => {
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
    cardElements.push(
      this.positionBlank(this.placeholderSpot, this.placeholderSpot.type)
    )
    return cardElements
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
        {this.positionCards().map(el => el)}
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
