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

// const BlankCard = styled.div`
//   height: ${props => props.h}px;
//   left: ${props => props.x}px;
//   position: absolute;
//   top: ${props => props.y}px;
//   transform-origin: left top;
//   transform: scale(${props => 1 / props.zoomLevel});
//   width: ${props => props.w}px;

//   &:hover {
//     background-color: ${v.colors.primaryLight};
//   }
// `

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

const COLS = 16
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
  @observable
  dragGridSpot = {}
  @observable
  dragging = false
  @observable
  hoverGridSpot = {}

  componentDidMount() {
    this.positionCards()
  }

  get totalRows() {
    return 8
  }

  get totalSpots() {
    return this.totalRows * COLS
  }

  isBeingDraggedOn({ x, y }) {
    return x === this.dragGridSpot.x && y === this.dragGridSpot.y
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

  handleMouseOver = ev => {
    const hoverPos = {
      x: ev.pageX - 170 + this.gridRef.scrollLeft,
      y: ev.pageY - 200 + this.gridRef.scrollTop,
    }
    const overlap = this.findOverlap(hoverPos)
    // console.log('over', hoverPos)
    // console.log('overlap', overlap)
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
    const overlapPos = {
      x: dragPosition.dragX,
      y: dragPosition.dragY,
    }
    const overlap = this.findOverlap(overlapPos)
    if (!overlap) {
      runInAction(() => {
        this.dragGridSpot = null
      })
      return
    }
    const maybeCard = this.findCardForSpot(overlap)
    if (maybeCard) {
      this.determineCardDrag(maybeCard, dragPosition)
    } else {
      runInAction(() => {
        this.dragGridSpot = overlap
      })
    }
  }

  determineCardDrag(card, dragPosition) {
    const { record } = card
    const { dragX } = dragPosition
    const { gridW } = this.props
    const leftAreaSize = gridW * 0.23
    const position = this.positionForSpot({ x: card.x, y: card.y })
    let direction = 'left'
    if (record && record.internalType === 'collections') {
      // only collections have a "hover right" area
      direction = dragX >= position.x + leftAreaSize ? 'right' : 'left'
    }
    runInAction(() => {
      this.dragGridSpot = {
        x: position.x,
        y: position.y,
        direction,
        card,
      }
    })
  }

  findOverlap(dragPosition) {
    const { x, y } = dragPosition
    // TODO should have different names for absolute, px, grid positions
    // vs layout x, y
    const dx = x
    const dy = y
    const { gridW, gridH, gutter } = this.props

    const { zoomLevel } = this

    const row = Math.floor(((dy + gutter * 0.5) / (gridH + gutter)) * zoomLevel)
    const col = Math.floor(((dx + gutter * 2) / (gridW + gutter)) * zoomLevel)
    if (row === -1 || col === -1) return null
    return { x: col, y: row }
  }

  onDragOrResizeStop = (cardId, dragType, ev) => {
    console.log('drag stop', ev)

    runInAction(() => {
      this.dragging = false
    })
    if (dragType === 'resize') {
      console.log('drag stop', ev)
      // just some double-checking validations
      // if (height > 2) height = 2
      // if (width > 4) width = 4
      // // set up action to undo
      // if (original.height !== height || original.width !== width) {
      //   undoMessage = 'Card resize undone'
      // }
      // updates.width = width
      // updates.height = height

      // // If a template, warn that any instances will be updated
      // updateCollectionCard = () => {
      //   // this will assign the update attributes to the card
      //   this.props.updateCollection({
      //     card: original,
      //     updates,
      //     undoMessage,
      //   })
      //   this.positionCardsFromProps()
      // }
      // }
    }
  }

  onResize = (cardId, newSize) => {}

  findCardForSpot({ x, y }) {
    const cards = this.props.collection.collection_cards
    return cards.find(card => card.x === x && card.y === y)
  }

  positionForSpot({ x, y }) {
    const { gridW, gridH, gutter } = this.props
    const { zoomLevel } = this
    const pos = {
      x: (x * (gridW + gutter)) / zoomLevel,
      y: (y * (gridH + gutter)) / zoomLevel,
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

  positionCard(card, { x, y, idx }) {
    const { canEditCollection, collection, routingStore, uiStore } = this.props
    const position = this.positionForSpot({ x, y })
    const { cardMenuOpen } = uiStore
    const { zoomLevel } = this
    const beingDraggedOn =
      this.dragGridSpot.card && this.dragGridSpot.card.id === card.id
    const hoverOverLeft =
      beingDraggedOn && this.dragGridSpot.direction === 'left'
    const hoverOverRight =
      beingDraggedOn && this.dragGridSpot.direction === 'right'
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

  positionBlank({ x, y, i }) {
    const position = this.positionForSpot({ x, y })
    const { zoomLevel } = this
    if (this.hoverGridSpot.x === x && this.hoverGridSpot.y === y) {
      return (
        <BlankCard
          idx={i}
          onClick={this.handleBlankCardClick.bind(this, { x, y, idx: i })}
          {...position}
          zoomLevel={zoomLevel}
          data-idx={i}
          draggedOn={this.isBeingDraggedOn({ x, y })}
        />
      )
    }
    return null
  }

  positionBct({ x, y, idx }) {
    const { canEditCollection, collection, routingStore } = this.props
    const position = this.positionForSpot({ x, y })
    // TODO this has to be documented
    const blankCard = {
      id: 'blank',
      num: 0,
      cardType: 'blank',
      blankType: null,
      width: 1,
      height: 1,
      order: idx,
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
    const allCardsToLayout = [...collection.collection_cards]
    if (this.hoverGridSpot) allCardsToLayout.push(this.hoverGridSpot)
    if (this.dragGridSpot) allCardsToLayout.push(this.dragGridSpot)
    const i = 0
    const cardElements = allCardsToLayout.map(spot => {
      const { x, y } = spot
      if (!spot.id) {
        return this.positionBlank({ x, y, i })
      }
      if (
        this.dragging &&
        spot.isBeingMultiMoved &&
        spot.id !== uiStore.dragCardMaster
      ) {
        return this.positionBlank({ x, y, i })
      }
      return this.positionCard(spot, { x, y, i })
    })
    return cardElements
  }

  render() {
    return (
      <Grid
        onMouseMove={this.handleMouseOver}
        innerRef={ref => {
          this.gridRef = ref
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 250 }}>
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
