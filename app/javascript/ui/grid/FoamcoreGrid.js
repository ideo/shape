import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import styled from 'styled-components'
import v, { MAX_CARD_WIDTH, MAX_CARD_HEIGHT } from '~/utils/variables'

import MovableGridCard from '~/ui/grid/MovableGridCard'

function getMapKey({ col, row }) {
  return `${col},${row}`
}

function isPointSame(first, other) {
  return first.row === other.row && first.col === other.col
}

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
  draggingMap = []

  constructor(props) {
    super(props)
    this.debouncedSetDraggedOnSpots = _.debounce(this.setDraggedOnSpots, 25)
    this.throttledSetHoverSpot = _.throttle(this.setHoverSpot, 50)
    this.throttledSetResizeSpot = _.throttle(this.setResizeSpot, 25)
  }

  componentDidMount() {
    this.positionCards()
    this.filledSpots = this.calculateFilledSpots()
  }

  componentDidUpdate() {
    this.positionCards()
    this.filledSpots = this.calculateFilledSpots()
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
    const pageMargin = v.containerPadding.horizontal * 16 * this.zoomLevel
    const hoverPos = {
      x: ev.pageX - pageMargin + this.gridRef.scrollLeft,
      y: ev.pageY - v.headerHeight + this.gridRef.scrollTop,
    }
    this.throttledSetHoverSpot(hoverPos)
  }

  handleMouseOut = ev => {
    runInAction(() => {
      this.placeholderSpot = {}
    })
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
    const overlapCoords = this.findOverlap(overlapPos)
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
    if (height > MAX_CARD_HEIGHT) height = MAX_CARD_HEIGHT
    if (width > MAX_CARD_WIDTH) width = MAX_CARD_WIDTH
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
      if (movePlaceholder && movePlaceholder.card) return

      const { row, col } = movePlaceholder
      const updates = { row, col }
      this.updateCardWithUndo(card, updates, undoMessage)
    }
  }

  setDraggedOnSpots(overlapCoords, dragPosition, recur) {
    /*
     * Sets the current spots that are being dragged on, whether it's a card
     * or a blank spot that then has to be rendered
     */
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

  determineDragMap(cardId) {
    /*
     * The drag map is an array of spots that represents the positions of all
     * cards that are being dragged relative to the card actually being dragged
     *
     * Card being dragged: { col: 2, row: 1}
     * Other card dragged along: { col: 3, row: 1}
     * Drag map: [{ col: 0, row: 0}, { col: 1, row: 0}]
     */
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

  setCardDragSpot(card, dragPosition) {
    /*
     * This method takes a card and drag position and adds some extra data to
     * the drag spot, such as the direction, which tells what action should
     * happen when a card is being dragged on.
     */
    const { record } = card
    const { dragX } = dragPosition
    const { gridW } = this.props
    const leftAreaSize = gridW * 0.23
    const position = this.positionForSpot(card)
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

  setMultiMoveDragSpots(masterPosition, dragPosition) {
    /* This method will set the dragged-over spots for the other cards that
     * maybe are being dragged along with the one that the user is actually
     * dragging. It will only be called if multiple cards are being dragged.
     */
    this.draggingMap.forEach(mapped => {
      const relativePosition = {
        col: mapped.col + masterPosition.col,
        row: mapped.row + masterPosition.row,
      }
      this.setDraggedOnSpots(relativePosition, dragPosition, true)
    })
  }

  findOverlap(dragPosition) {
    const { x, y } = dragPosition
    const { gridW, gridH, gutter } = this.props

    const { zoomLevel } = this

    const row = Math.floor(((y + gutter * 0.5) / (gridH + gutter)) * zoomLevel)
    const col = Math.floor(((x + gutter * 2) / (gridW + gutter)) * zoomLevel)
    if (row === -1 || col === -1) return null
    return { col, row }
  }

  setHoverSpot(hoverPos) {
    if (this.resizing) return
    const overlap = this.findOverlap(hoverPos)
    runInAction(() => {
      if (overlap) {
        // Don't place a hover card when there's already a card there.
        if (this.findCardForSpot(overlap)) {
          this.placeholderSpot = {}
          return
        }
        if (!this.placeholderSpot.x) {
          this.placeholderSpot = { ...overlap, type: 'hover' }
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

  findCardForSpot({ col, row }) {
    const cards = this.props.collection.collection_cards
    return cards.find(card => isPointSame(card, { col, row }))
  }

  positionForSpot({ col, row, width = 1, height = 1 }) {
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
    while (tempCol <= col + MAX_CARD_WIDTH) {
      const filled = this.findFilledSpot({ col: tempCol, row }, cardId)
      if (filled) {
        return tempCol - col
      }
      tempCol += 1
    }
    return MAX_CARD_WIDTH
  }

  calcEdgeRow({ col, row, height }, cardId) {
    let tempRow = row + height - 1
    while (tempRow <= MAX_CARD_HEIGHT) {
      const filled = this.findFilledSpot({ row: tempRow, col }, cardId)
      if (filled) {
        return tempRow - row
      }
      tempRow += 1
    }
    return MAX_CARD_HEIGHT
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

    return this.renderMovableCard(card, card.id, {
      hoverOverLeft,
      hoverOverRight,
    })
  }

  positionBlank({ row, col, width, height }, type = 'generic') {
    const position = this.positionForSpot({ col, row, width, height })
    const { zoomLevel } = this
    if (this.dragging || isPointSame(this.placeholderSpot, { col, row })) {
      return (
        <BlankCard
          onClick={this.handleBlankCardClick({ col, row })}
          {...position}
          zoomLevel={zoomLevel}
          key={`blank-${col}:${row}`}
          data-blank-type={type}
          draggedOn
        >
          <StyledPlusIcon />
        </BlankCard>
      )
    }
    return null
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
      record: {},
    }
    return this.renderMovableCard(blankContentTool, `bct-${col}:${row}`, {})
  }

  positionCards() {
    const { collection } = this.props
    let allCardsToLayout = [...collection.collection_cards]
    if (this.blankContentTool) allCardsToLayout.push(this.blankContentTool)
    if (this.dragGridSpot.size)
      allCardsToLayout = [...allCardsToLayout, ...this.dragGridSpot.values()]

    // Don't render cards that are being dragged along
    allCardsToLayout = allCardsToLayout.filter(
      card => !card.isBeingMultiDragged
    )
    const cardElements = allCardsToLayout.map(spot => {
      // If another real card is filling up the hover spot, don't render
      // the hover spot at all (which gets rendered after this loop)
      if (spot.id === 'blank') {
        return this.positionBct(spot)
      }
      if (spot.id) {
        return this.positionCard(spot)
      }
      return this.positionBlank(spot, 'drag')
    })
    cardElements.push(
      this.positionBlank(this.placeholderSpot, this.placeholderSpot.type)
    )
    return cardElements
  }

  renderMovableCard(card, key, opts) {
    const { canEditCollection, collection, routingStore, uiStore } = this.props
    const { cardMenuOpen } = uiStore
    const cardType = card.record ? card.record.internalType : card.cardType
    const position = this.positionForSpot(card)

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

// Should this be its own component, especially if it will have click handling?
const BlankCard = styled.div.attrs({
  style: ({ x, y, h, w, zoomLevel, draggedOn }) => ({
    height: `${h}px`,
    left: x ? `${x}px` : '0px',
    top: y ?  `${y}px` : '0px',
    transform: `scale(${1 / zoomLevel})`,
    width: `${w}px`,
  }),
})`
  background-color: ${v.colors.primaryLight};
  position: absolute;
  transform-origin: left top;
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
  }
  z-index: 0;
`
// Copied over from GridCardHotspot. Should probably extract to own component.
const StyledPlusIcon = styled.div`
  position: relative;
  left: -9px;
  width: 12px;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`

const Grid = styled.div`
  min-height: 1300px;
  overflow-x: scroll;
  overflow-y: scroll;
  position: relative;
`

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
