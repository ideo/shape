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

const BlankCard = styled.div.attrs({
  style: ({ x, y, h, w, zoomLevel, draggedOn }) => ({
    backgroundColor: draggedOn ? v.colors.primaryLight : 'transparent',
    height: `${h}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `scale(${1 / zoomLevel})`,
    width: `${w}px`,
  }),
})`
  position: absolute;
  transform-origin: left top;
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
  }
  z-index: 0;
`

const Grid = styled.div`
  min-height: 800px;
  overflow-x: scroll;
  overflow-y: scroll;
  position: relative;
`

function getMapKey({ col, row }) {
  return `${col},${row}`
}

// needs to be an observer to observe changes to the collection + items
@inject('apiStore', 'routingStore', 'uiStore')
@observer
class FoamcoreGrid extends React.Component {
  gridRef = null
  @observable
  positionedCards = []
  @observable
  blankCard = { idx: null }
  @observable
  zoomLevel = 1
  dragGridSpot = observable.map({})
  @observable
  dragging = false
  @observable
  hoverGridSpot = {}
  @observable
  draggingMap = []

  constructor(props) {
    super(props)
    this.debouncedSetDraggedOnSpots = _.debounce(this.setDraggedOnSpots, 25)
  }

  componentDidMount() {
    this.positionCards()
  }

  getDraggedOnSpot(coords) {
    return this.dragGridSpot.get(getMapKey(coords))
  }

  isBeingDraggedOn(coords) {
    return !!this.getDraggedOnSpot(coords)
  }

  handleBlankCardClick = data => {
    runInAction(() => {
      this.blankCard = data
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
    // TODO this re-renders so probably throttle it?
    // TODO 170 and 200 should be based on actual values for header height and
    // margins on the page
    const hoverPos = {
      x: ev.pageX - 170 + this.gridRef.scrollLeft,
      y: ev.pageY - 200 + this.gridRef.scrollTop,
    }
    const overlap = this.findOverlap(hoverPos)
    runInAction(() => {
      if (overlap) {
        this.hoverGridSpot = overlap
      } else {
        this.hoverGridSpot = {}
      }
    })
  }

  handleMouseOut = ev => {
    runInAction(() => {
      this.hoverGridSpot = {}
    })
  }

  onDrag = (cardId, dragPosition) => {
    runInAction(() => {
      this.dragging = true
    })
    // TODO considering changing dragX in MoveableGridCard
    const overlapPos = {
      x: dragPosition.dragX,
      y: dragPosition.dragY,
    }
    // TODO move this somewhere where it's more efficient and doesn't rerender
    const overlapCoords = this.findOverlap(overlapPos)
    this.debouncedSetDraggedOnSpots(overlapCoords, dragPosition)
  }

  onDragStart = cardId => {
    const dragMap = this.determineDragMap(cardId)
    runInAction(() => {
      this.draggingMap = dragMap
    })
  }

  onDragOrResizeStop = (cardId, dragType, ev) => {
    console.log('drag stop', ev)
    // TODO clear the overridden drag positions when stop dragging

    runInAction(() => {
      this.dragging = false
    })
    if (dragType === 'resize') {
      console.log('drag stop', ev)
    }
  }

  onResize = (cardId, newSize) => {}

  setDraggedOnSpots(overlapCoords, dragPosition, recur) {
    /*
     * Sets the current spots that are being dragged on, whether it's a card
     * or a blank spot that then has to be rendered
     */
    if (!recur) {
      runInAction(() => {
        this.dragGridSpot.clear()
      })
    }
    const { uiStore } = this.props
    if (!overlapCoords) {
      return
    }
    // TODO refactor confusing different return types here
    const maybeCard = this.findCardForSpot(overlapCoords)
    if (maybeCard) {
      this.setCardDragSpot(maybeCard, dragPosition)
      if (uiStore.multiMoveCardIds.length > 1 && !recur) {
        // TODO omg rename
        this.setMultiMoveDragSpots(overlapCoords, dragPosition)
      }
      return
    }
    runInAction(() => {
      this.dragGridSpot.set(getMapKey(overlapCoords), overlapCoords)
    })
    if (uiStore.multiMoveCardIds.length > 1 && !recur) {
      // TODO omg rename
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

  findCardForSpot({ col, row }) {
    const cards = this.props.collection.collection_cards
    return cards.find(card => card.col === col && card.row === row)
  }

  positionForSpot({ col, row }) {
    const { gridW, gridH, gutter } = this.props
    const { zoomLevel } = this
    const pos = {
      x: (col * (gridW + gutter)) / zoomLevel,
      y: (row * (gridH + gutter)) / zoomLevel,
      w: 1 * (gridW + gutter) - gutter,
      h: 1 * (gridH + gutter) - gutter,
    }
    return {
      ...pos,
      xPos: pos.x,
      yPos: pos.y,
      width: pos.w,
      height: pos.h,
    }
  }

  positionCard(card, { col, row }) {
    const { canEditCollection, collection, routingStore, uiStore } = this.props
    const position = this.positionForSpot({ col, row })
    const { cardMenuOpen } = uiStore
    const { zoomLevel } = this
    const beingDraggedOnSpot =
      this.dragging && this.getDraggedOnSpot({ col, row })
    const hoverOverLeft =
      beingDraggedOnSpot && beingDraggedOnSpot.direction === 'left'
    const hoverOverRight =
      beingDraggedOnSpot && beingDraggedOnSpot.direction === 'right'

    return (
      <MovableGridCard
        key={card.id}
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
      />
    )
  }

  positionBlank({ row, col }) {
    const position = this.positionForSpot({ col, row })
    const { zoomLevel } = this
    if (
      this.dragging ||
      (this.hoverGridSpot.col === col && this.hoverGridSpot.row === row)
    ) {
      return (
        <BlankCard
          onClick={this.handleBlankCardClick.bind(this, { col, row })}
          {...position}
          zoomLevel={zoomLevel}
          draggedOn={this.dragging && this.isBeingDraggedOn({ col, row })}
        />
      )
    }
    return null
  }

  positionBct({ col, row }) {
    const { canEditCollection, collection, routingStore } = this.props
    const position = this.positionForSpot({ col, row })
    // TODO this has to be documented
    const blankCard = {
      id: 'blank',
      num: 0,
      cardType: 'blank',
      blankType: null,
      width: 1,
      height: 1,
    }
    const { zoomLevel } = this
    return (
      <MovableGridCard
        key={blankCard.id}
        card={blankCard}
        cardType={blankCard.cardType}
        canEditCollection={canEditCollection}
        isUserCollection={collection.isUserCollection}
        isSharedCollection={collection.isSharedCollection}
        position={position}
        record={blankCard.record}
        routeTo={routingStore.routeTo}
        parent={collection}
        zoomLevel={zoomLevel}
      />
    )
  }

  positionCards() {
    const { collection, uiStore } = this.props
    let allCardsToLayout = [...collection.collection_cards]
    if (this.hoverGridSpot) allCardsToLayout.push(this.hoverGridSpot)
    if (this.dragGridSpot.size)
      allCardsToLayout = [...allCardsToLayout, ...this.dragGridSpot.values()]
    const cardElements = allCardsToLayout.map(spot => {
      const { col, row } = spot
      if (
        !spot.id ||
        (spot.isBeingMultiMoved && uiStore.dragCardMaster !== spot.id)
      ) {
        return this.positionBlank({ col, row })
      }
      return this.positionCard(spot, { col, row })
    })
    return cardElements
  }

  render() {
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
