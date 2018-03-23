import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import MovableGridCard from '~/ui/grid/MovableGridCard'

const calculateDistance = (pos1, pos2) => {
  // pythagoras!
  const a = pos2.x - pos1.x
  const b = pos2.y - pos1.y
  return Math.sqrt((a * a) + (b * b))
}

// needs to be an observer to observe changes to the collection + items
@inject('routingStore', 'uiStore')
@observer
class CollectionGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cards: [],
      hoveringOver: { order: null },
      timeoutId: null,
      transitioning: false,
    }
  }

  componentDidMount() {
    this.positionCards(this.props.collection.collection_cards)
  }

  componentWillReceiveProps(nextProps) {
    const { collection } = nextProps
    // convert observableArray values into a "normal" JS array (equivalent of .toJS())
    // for the sake of later calculations/manipulations
    const cards = [...collection.collection_cards]
    // If we already have a BCT open, find it in our cards
    if (nextProps.blankContentToolState) {
      const order = nextProps.blankContentToolState.order + 0.5
      let blankCard = {
        id: 'blank',
        num: 0,
        cardType: 'blank',
        width: 1,
        height: 1,
        order,
      }
      const blankFound = _.find(this.state.cards, { cardType: 'blank' })
      // Look for card in state...
      if (blankFound && blankFound.order !== order) {
        // HACK: `num` just makes it so that BCT can get a new unique `id`
        // otherwise grid thinks the BCT has simply "moved"
        blankFound.num += 1
        blankFound.id = `blank-${blankFound.num}`
        // Increments order from existing BCT order
        blankCard = { ...blankFound, order }
      }
      // Always add a blank card to the beginning of collection cards
      // If they have edit capabilities
      if (this.props.canEditCollection) {
        cards.unshift(blankCard)
      }
    }
    this.positionCards(cards, { props: nextProps })
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  // --------------------------
  // <Drag related functions>
  // --------------------------
  onResize = (cardId, newSize) => {
    const { uiStore } = this.props
    uiStore.closeBlankContentTool()

    const positionedCard = _.find(this.state.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    const stateCards = [...this.state.cards]
    const placeholder = _.find(stateCards, { id: placeholderKey })

    if (!placeholder) {
      this.createPlaceholderCard(positionedCard, newSize)
    } else if (placeholder.width !== newSize.width || placeholder.height !== newSize.height) {
      placeholder.width = newSize.width
      placeholder.height = newSize.height
      this.positionCards(stateCards, { dragging: positionedCard.id })
    }
  }

  onMoveStop = () => {
    const placeholder = _.find(this.state.cards, { cardType: 'placeholder' }) || {}
    const original = _.find(this.state.cards, { id: placeholder.originalId })

    this.clearDragTimeout()
    this.setState({ transitioning: false, hoveringOver: { order: null } })
    if (!placeholder || !original) return

    const fields = ['order', 'width', 'height']
    const placeholderPosition = _.pick(placeholder, fields)
    placeholderPosition.order = Math.ceil(placeholderPosition.order)
    const originalPosition = _.pick(original, fields)

    const moved = (!_.isEqual(placeholderPosition, originalPosition))
    if (moved) {
      // we want to update this card to match the placeholder
      const { order } = placeholder
      let { width, height } = placeholder
      // just some double-checking validations
      if (height > 2) height = 2
      if (width > 4) width = 4
      _.assign(original, { order, width, height })

      // reorder cards and persist changes
      this.props.updateCollection()
      this.positionCards(this.props.collection.collection_cards)
    } else {
      // reset back to normal
      this.positionCards(this.props.collection.collection_cards)
    }
  }

  onDrag = (cardId, dragPosition) => {
    this.props.uiStore.closeBlankContentTool()
    if (this.state.transitioning) return

    const positionedCard = _.find(this.state.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    const stateCards = [...this.state.cards]
    const placeholder = _.find(stateCards, { id: placeholderKey })
    const hoveringOver = this.findOverlap(cardId, dragPosition)
    if (!placeholder) {
      this.createPlaceholderCard(positionedCard)
    } else if (hoveringOver) {
      const { direction, order } = hoveringOver
      const newOrder = parseFloat(order) + (direction === 'left' ? -0.5 : 0.5)
      const positionChanged = (
        hoveringOver.order !== this.state.hoveringOver.order ||
        newOrder !== placeholder.order
      )
      if (positionChanged) {
        // NOTE: this will modify observable card attrs, for later save/update
        placeholder.order = newOrder
        this.positionCards(stateCards, {
          dragging: positionedCard.id,
          hoveringOver: hoveringOver.order
        })
        // set temporary transitioning state so that multiple changes can't
        // be triggered within milliseconds of each other, creating flicker
        this.setState({ transitioning: true, hoveringOver })
        const timeoutId = setTimeout(() => {
          this.setState({ transitioning: false })
        }, 350)
        this.setState({ timeoutId })
      }
    } else {
      this.setState({ hoveringOver: { order: null } })
    }
  }

  createPlaceholderCard = (original, { width = original.width, height = original.height } = {}) => {
    const placeholderKey = `${original.id}-placeholder`
    const placeholder = {
      position: original.position,
      width,
      height,
      // better way to do this??
      order: original.order,
      id: placeholderKey,
      originalId: original.id,
      cardType: 'placeholder'
    }
    const newItems = _.concat(this.state.cards, placeholder)
    this.positionCards(newItems, { dragging: original.id })
  }

  findOverlap = (cardId, dragPosition) => {
    let hoveringOver = null
    const { dragX, dragY } = dragPosition
    const distances = _.map(this.state.cards, card => {
      const placeholder = (
        card.cardType === 'placeholder' ||
        card.cardType === 'blank'
      )
      if (card.id === cardId || placeholder) return null
      // only run this check if we're within the reasonable row bounds
      if (card.position.yPos <= (dragY + 15) &&
          card.position.yPos + card.position.height >= (dragY - 15)) {
        const mousePos = { x: dragX, y: dragY }
        // const cardCenter = {
        //   x: card.position.xPos + (card.position.width / 2),
        //   y: card.position.yPos + (card.position.height / 2),
        // }
        const cardTL = {
          x: card.position.xPos,
          y: card.position.yPos,
        }
        const cardTR = {
          x: card.position.xPos + card.position.width,
          y: card.position.yPos,
        }
        const cardBL = {
          x: card.position.xPos,
          y: card.position.yPos + card.position.height,
        }
        const cardBR = {
          x: card.position.xPos + card.position.width,
          y: card.position.yPos + card.position.height,
        }
        const distanceTL = calculateDistance(mousePos, cardTL)
        const distanceTR = calculateDistance(mousePos, cardTR)
        const distanceBL = calculateDistance(mousePos, cardBL)
        const distanceBR = calculateDistance(mousePos, cardBR)
        const distance = Math.min(distanceTL, distanceTR, distanceBL, distanceBR)
        let direction = 'left'
        if (dragY > card.position.yPos &&
            ((distance === distanceBR || distance === distanceTR) ||
            (dragY > (card.position.yPos + card.position.height)))) {
          direction = 'right'
        }
        const { order, record } = card
        return {
          order,
          distance,
          direction,
          record
        }
      }
      return null
    })
    const closest = _.first(_.sortBy(distances, 'distance'))
    if (closest) {
      hoveringOver = closest
    }
    return hoveringOver
  }

  clearDragTimeout = () => {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId)
      this.setState({ timeoutId: null })
    }
  }

  // --------------------------
  // </end Drag related functions>
  // --------------------------

  // Sorts cards and sets state.cards after doing so
  positionCards = (collectionCards = [], opts = {}) => {
    const cards = [...collectionCards]
    // props might get passed in e.g. nextProps for componentWillReceiveProps
    if (!opts.props) opts.props = this.props
    const {
      gridW,
      gridH,
      gutter,
      cols
    } = opts.props
    let row = 0
    const matrix = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))
    _.each(_.sortBy(cards, 'order'), card => {
      // we don't actually want to "re-position" the dragging card
      // because its position is being determined by the drag (i.e. mouse cursor)
      if (opts.dragging === card.id) {
        return
      }

      let position = {}
      let filled = false
      // find an open row that can fit the current card
      // NOTE: row limit check is to catch any bad calculations with resizing/moving
      while (!filled && row < 200) {
        let itFits = false
        let gap = 0
        let nextX = 0
        // e.g. if card.width is 4, but we're at 2 columns, max out at cardWidth = 2
        const cardWidth = Math.min(cols, card.width)
        // stored so we can refer to the current maxWidth in other components
        if (card.setMaxWidth) {
          card.setMaxWidth(cardWidth)
        }
        // go through the row and see if there is an empty gap that fits card.w
        for (let x = 0; x < cols; x += 1) {
          if (matrix[row][x] === null) {
            gap += 1
          } else {
            gap = 0
          }
          if (gap >= cardWidth) {
            // jump back the number of spaces to the opening of the gap
            nextX = (x + 1) - cardWidth
            itFits = true
            break
          }
        }
        if (itFits) {
          filled = true
          position = {
            x: nextX,
            y: row
          }
          _.assign(position, {
            xPos: position.x * (gridW + gutter),
            yPos: position.y * (gridH + gutter),
            width: (cardWidth * (gridW + gutter)) - gutter,
            height: (card.height * (gridH + gutter)) - gutter,
          })

          // add position attrs to card
          card.position = position
          card.hoveringOver = false
          if (opts.hoveringOver) {
            card.hoveringOver = (opts.hoveringOver === card.order)
          }

          // fill rows and columns
          _.fill(matrix[row], card.id, position.x, position.x + cardWidth)
          for (let y = 1; y < card.height; y += 1) {
            if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
            _.fill(matrix[row + y], card.id, position.x, position.x + cardWidth)
          }

          // NOTE: if you remove this check, then it will fill things in
          // slightly out of order to "fill empty gaps" at the end of the row
          // if (nextX + card.w === cols) {
          //   row += 1
          //   if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
          // }
          //  --------
        } else {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      }
    })
    // update cards in state
    this.setState({ cards })
  }

  renderPositionedCards = () => {
    const grid = []
    const {
      collection,
      canEditCollection,
      routingStore,
      uiStore,
    } = this.props
    // unnecessary? we seem to need to preserve the array order
    // in order to not re-draw divs (make transform animation work)
    // so that's why we do this second pass to actually create the divs in their original order
    _.each(this.state.cards, card => {
      let record = {}
      let { cardType } = card
      if (cardType !== 'placeholder' && cardType !== 'blank') {
        // TODO: some kind of error catch if no record?
        if (card.record) {
          ({ record } = card)
          // getRecordType gets either 'items' or 'collections'
          cardType = card.record.getRecordType()
        }
      }
      const { openCardMenuId } = uiStore
      grid.push(
        <MovableGridCard
          key={card.id}
          card={card}
          cardType={cardType}
          canEditCollection={canEditCollection}
          isUserCollection={collection.isUserCollection}
          isSharedCollection={collection.isSharedCollection}
          position={card.position}
          record={record}
          onDrag={this.onDrag}
          onMoveStop={this.onMoveStop}
          onResize={this.onResize}
          onResizeStop={this.onResizeStop}
          routeTo={routingStore.routeTo}
          parent={collection}
          menuOpen={openCardMenuId === card.id}
        />
      )
    })
    return grid
  }

  render() {
    const { cardIds } = this.props
    // Rendering cardIds so that grid re-renders when they change
    return (
      <div className="Grid" data-card-ids={cardIds}>
        { this.renderPositionedCards() }
      </div>
    )
  }
}

CollectionGrid.propTypes = {
  // these gridSettings are technically props,
  // but they confuse eslint because of the way they're used in positionCards
  // ---
  // cols: PropTypes.number.isRequired,
  // gridH: PropTypes.number.isRequired,
  // gridW: PropTypes.number.isRequired,
  // gutter: PropTypes.number.isRequired,
  updateCollection: PropTypes.func.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  blankContentToolState: MobxPropTypes.objectOrObservableObject,
  cardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
}
CollectionGrid.defaultProps = {
  blankContentToolState: null
}
CollectionGrid.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionGrid.displayName = 'InjectedCollectionGrid'

export default CollectionGrid
