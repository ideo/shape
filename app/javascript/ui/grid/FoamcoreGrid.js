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
  style: ({ x, y, h, w, zoomLevel }) => ({
    height: `${h}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `scale(${1 / zoomLevel})`,
    width: `${w}px`,
  }),
})`
  position: absolute;
  transform-origin: left top;
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
  @observable
  positionedCards = []
  @observable
  blankCard = { idx: null }
  @observable
  zoomLevel = 1

  componentDidMount() {
    this.positionCards()
  }

  get totalRows() {
    return 8
  }

  get totalSpots() {
    return this.totalRows * COLS
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

  onDrag = (cardId, dragPosition) => {}

  onDragOrResizeStop = (cardId, dragType, ev) => {
    console.log('drag stop', ev)
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
        hoveringOverLeft={
          !!card.hoveringOver && card.hoveringOver.direction === 'left'
        }
        hoveringOverRight={
          !!card.hoveringOver && card.hoveringOver.direction === 'right'
        }
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
    return (
      <BlankCard
        idx={i}
        onClick={this.handleBlankCardClick.bind(this, { x, y, idx: i })}
        {...position}
        zoomLevel={zoomLevel}
        data-idx={i}
      />
    )
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
    const tempCards = []
    let y = 0
    let x = 0
    let i = 0
    while (y <= this.totalRows) {
      x = 0
      while (x <= COLS) {
        const potentialCard = this.findCardForSpot({ x, y })
        if (potentialCard) {
          tempCards.push(this.positionCard(potentialCard, { x, y, i }))
        } else if (this.blankCard.idx === i) {
          tempCards.push(this.positionBct({ x, y, i }))
        } else {
          tempCards.push(this.positionBlank({ x, y, i }))
        }
        x += 1
        i += 1
      }
      y += 1
    }
    return tempCards
  }

  render() {
    return (
      <Grid>
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
