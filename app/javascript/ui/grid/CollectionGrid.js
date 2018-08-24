import PropTypes from 'prop-types'
import { action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import Loader from '~/ui/layout/Loader'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import CollectionCard from '~/stores/jsonApi/CollectionCard'

const StyledGrid = styled.div`
  margin-top: 50px;
  min-height: ${props => props.minHeight}px;
  position: relative;
  width: 100%;
  transition: all 0.5s;

  .react-draggable-dragged:not(.react-draggable-dragging) {
    /* this is to transition the draggable back to its original spot when you let go */
    transition: all 0.5s;
  }
`
StyledGrid.displayName = 'StyledGrid'

const calculateDistance = (pos1, pos2) => {
  // pythagoras!
  const a = pos2.x - pos1.x
  const b = pos2.y - pos1.y
  return Math.sqrt((a * a) + (b * b))
}

const groupByConsecutive = (array, value) => {
  const groups = []
  let buffer = []
  for (let i = 0; i < array.length; i += 1) {
    const curItem = array[i]
    if (curItem === value) {
      buffer.push(i)
    } else if (buffer.length > 0) {
      groups.push(buffer)
      buffer = []
    }
  }
  if (buffer.length > 0) groups.push(buffer)
  return groups
}

// needs to be an observer to observe changes to the collection + items
@inject('routingStore', 'uiStore')
@observer
class CollectionGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cards: [],
      rows: 1,
      hoveringOver: { order: null },
      timeoutId: null,
      transitioning: false,
    }
  }

  componentDidMount() {
    const cards = this.condtionallyAddBct(this.props)
    this.positionCards(cards)
  }

  componentWillReceiveProps(nextProps) {
    const cards = this.condtionallyAddBct(nextProps)
    this.positionCards(cards, { props: nextProps })
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  condtionallyAddBct(props) {
    const {
      blankContentToolState,
      collection,
      cardIds,
      movingCardIds,
    } = props
    // convert observableArray values into a "normal" JS array (equivalent of .toJS())
    // for the sake of later calculations/manipulations
    const cards = [...collection.collection_cards]
    if (movingCardIds) {
      _.each(movingCardIds, id => _.remove(cards, { id }))
    }
    // If we have a BCT open...
    if (blankContentToolState && blankContentToolState.order !== null) {
      // make the BCT appear to the right of the current card
      let { order } = blankContentToolState
      const {
        height,
        replacingId,
        parent_id,
        template,
        type,
        width,
      } = blankContentToolState
      if (replacingId) {
        // remove the card being replaced from our current state cards
        _.remove(cards, { id: replacingId })
      } else {
        // BCT is technically "order of hotspot card + 1"
        // so we have to bump it back by 0.5 so it isn't == with the next card
        order -= 0.5
      }
      let blankCard = {
        id: 'blank',
        num: 0,
        cardType: 'blank',
        blankType: type,
        width,
        height,
        order,
        parent_id,
        template,
      }
      // If we already have a BCT open, find it in our cards
      const blankFound = _.find(this.state.cards, { cardType: 'blank' })
      // Look for card in state...
      if (blankFound && blankFound.order !== order) {
        // HACK: `num` just makes it so that BCT can get a new unique `id`
        // otherwise grid thinks the BCT has simply "moved"
        blankFound.num += 1
        blankFound.id = `blank-${blankFound.num}`
        // Increments order from existing BCT order
        blankCard = { ...blankFound, order, width, height }
      }
      // NOTE: how reliable is this length check for indicating a newly added card?
      const previousLength = this.props.cardIds.length
      const cardJustAdded = cardIds.length === previousLength + 1
      if ((this.props.canEditCollection && !cardJustAdded) ||
        blankCard.blankType === 'submission') {
        // Add the BCT to the array of cards to be positioned, if they can edit
        cards.unshift(blankCard)
      }
    }
    return cards
  }

  // --------------------------
  // <Drag related functions>
  // --------------------------
  onResize = (cardId, newSize) => {
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

  onDragOrResizeStop = () => {
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
    if (this.state.transitioning) return

    const positionedCard = _.find(this.state.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    const stateCards = [...this.state.cards]
    const placeholder = _.find(stateCards, { id: placeholderKey })
    const hoveringOver = this.findOverlap(cardId, dragPosition)
    if (!this.props.canEditCollection) return
    if (hoveringOver && hoveringOver.card.isPinnedAndLocked) return
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
    const data = {
      position: original.position,
      width,
      height,
      // better way to do this??
      order: original.order,
      id: placeholderKey,
      originalId: original.id,
      cardType: 'placeholder',
      record: original.record,
    }
    const placeholder = new CollectionCard(data)
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
          card,
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

  // empty card acts as a spacer to always show the last row even if empty,
  // and to show a GridCardHotspot to the left when it's the first item in the empty row
  addEmptyCard = (cards) => {
    if (!this.props.canEditCollection) return
    if (_.find(cards, { id: 'empty' })) return
    let order = cards.length
    const max = _.maxBy(cards, 'order')
    if (max) order = max.order + 1
    const emptyCard = {
      id: 'empty',
      cardType: 'empty',
      width: 1,
      height: 1,
      order,
    }
    cards.push(emptyCard)
  }

  // Sorts cards and sets state.cards after doing so
  @action positionCards = (collectionCards = [], opts = {}) => {
    const cards = [...collectionCards]
    // props might get passed in e.g. nextProps for componentWillReceiveProps
    if (!opts.props) opts.props = this.props
    const {
      gridW,
      gridH,
      gutter,
      cols,
      sortBy,
      addEmptyCard,
    } = opts.props
    let row = 0
    const matrix = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))
    if (addEmptyCard) this.addEmptyCard(cards)
    const sortedCards = _.sortBy(cards, sortBy)
    _.each(sortedCards, (card, i) => {
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
        let nextX = 0
        let cardWidth = card.width
        let cardHeight = card.height
        if (card.calculateMaxSize) {
          // card.calculateMaxSize won't be defined for blank/placeholder cards
          ({ cardWidth, cardHeight } = card.calculateMaxSize(cols))
        }
        // go through the row and see if there is an empty gap that fits cardWidth
        const gaps = groupByConsecutive(matrix[row], null)
        const maxGap = _.maxBy(gaps, 'length') || { length: 0 }
        if (maxGap.length >= cardWidth) {
          [nextX] = maxGap
          itFits = true
        } else {
          // 2-COLUMN SPECIAL CASE FOR TEXT CARD:
          // - card is (2+)x1 or 1x2 text item and there is a gap of 1 remaining on this row
          // - shrink card to 1x1 to fit on the row.
          const shouldBackfillSmallGap = (
            card.isTextItem &&
            // here we actually check against the card's original dimensions, not its constraints
            ((card.width >= 2 && card.height === 1) || (card.height === 2 && card.width === 1)) &&
            cols === 2 && maxGap.length === 1
          )
          if (shouldBackfillSmallGap) {
            cardWidth = 1
            card.setMaxWidth(1)
            itFits = true
            if (cardHeight === 2) {
              cardHeight = 1
              card.setMaxHeight(1)
            }
            [nextX] = maxGap
            itFits = true
          }
        }
        // 2-COLUMN SPECIAL CASES FOR PREVIOUS TEXT CARDS:
        // 1. Check if prevCard is 1x1 but there is a gap to the right of it:
        //  - stretch to 2x1
        // 2. Check if prevCard is 1x2 and there is a tall gap to the right of it:
        //  - stretch to 2x2
        // 3. Check if prevCard is 1x2 and there is a short gap to the (bottom) left:
        //  - shrink to 1x1
        // 4. Likewise if prevPrevCard is 1x2 and there is a short gap to the (bottom) right:
        //  - shrink to 1x1
        const prevCard = sortedCards[i - 1]
        const prevPrevCard = sortedCards[i - 2]
        if (!itFits && cols === 2) {
          const canFitOneRow = (
            prevCard && prevCard.isTextItem &&
            maxGap.length > 0 && prevCard.position.x === 0 && prevCard.maxHeight === 1
          )
          const canFitTwoRows = (
            prevCard && prevCard.isTextItem &&
            prevCard.maxHeight === 2 &&
            row >= 1 &&
            matrix[row][1] === null &&
            matrix[row - 1][1] === null
          )
          const shouldShrinkOneRow = (
            prevCard && prevCard.isTextItem &&
            prevCard.maxHeight === 2 &&
            matrix[row][0] === null
          )
          const shouldShrinkPrevPrevOneRow = (
            prevPrevCard && prevPrevCard.isTextItem &&
            prevPrevCard.maxHeight === 2 &&
            matrix[row][1] === null
          )
          if (canFitOneRow || canFitTwoRows) {
            prevCard.setMaxWidth(2)
            prevCard.position.width = (2 * (gridW + gutter)) - gutter
          } else if (shouldShrinkOneRow) {
            prevCard.setMaxHeight(1)
            prevCard.position.height = (1 * (gridH + gutter)) - gutter
            itFits = true
            nextX = 0
          } else if (shouldShrinkPrevPrevOneRow) {
            prevPrevCard.setMaxHeight(1)
            prevPrevCard.position.height = (1 * (gridH + gutter)) - gutter
            itFits = true
            nextX = 0
          }
        }
        // --------------------------
        // </end special cases
        // --------------------------

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
            height: (cardHeight * (gridH + gutter)) - gutter,
          })

          // add position attrs to card
          card.position = position
          card.hoveringOver = false
          if (opts.hoveringOver) {
            card.hoveringOver = (opts.hoveringOver === card.order)
          }

          // fill rows and columns
          _.fill(matrix[row], card.id, position.x, position.x + cardWidth)
          for (let y = 1; y < cardHeight; y += 1) {
            if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
            _.fill(matrix[row + y], card.id, position.x, position.x + cardWidth)
          }
        } else {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      }
    })
    // update cards in state
    this.setState({
      cards,
      rows: matrix.length,
    })
  }

  renderPositionedCards = () => {
    const grid = []
    const {
      collection,
      canEditCollection,
      routingStore,
      uiStore,
    } = this.props
    let i = 0
    // unnecessary? we seem to need to preserve the array order
    // in order to not re-draw divs (make transform animation work)
    // so that's why we do this second pass to actually create the divs in their original order
    _.each(this.state.cards, card => {
      i += 1
      let record = {}
      let { cardType } = card
      if (!_.includes(['placeholder', 'blank', 'empty'], cardType)) {
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
          onDragOrResizeStop={this.onDragOrResizeStop}
          onResize={this.onResize}
          onResizeStop={this.onResizeStop}
          routeTo={routingStore.routeTo}
          parent={collection}
          menuOpen={openCardMenuId === card.id}
          lastPinnedCard={card.isPinnedAndLocked && i === this.state.cards.length - 1}
        />
      )
    })
    return grid
  }

  render() {
    const { uiStore } = this.props
    const { gridSettings } = uiStore
    const { rows } = this.state
    if (uiStore.isLoading) return <Loader />

    const minHeight = rows * (gridSettings.gridH + gridSettings.gutter)

    const { cardIds } = this.props.collection
    // Rendering cardIds so that grid re-renders when they change
    return (
      <StyledGrid data-card-ids={cardIds} minHeight={minHeight}>
        { this.renderPositionedCards() }
      </StyledGrid>
    )
  }
}

const gridConfigProps = {
  // these gridSettings confuse eslint because of the way they're used in positionCards
  // so we list them separately here
  cols: PropTypes.number.isRequired,
  gridH: PropTypes.number.isRequired,
  gridW: PropTypes.number.isRequired,
  gutter: PropTypes.number.isRequired,
  sortBy: PropTypes.string.isRequired,
}

CollectionGrid.propTypes = {
  ...gridConfigProps,
  updateCollection: PropTypes.func.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  blankContentToolState: MobxPropTypes.objectOrObservableObject.isRequired,
  cardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  movingCardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  addEmptyCard: PropTypes.bool,
}
CollectionGrid.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionGrid.defaultProps = {
  addEmtpyCard: true,
}
CollectionGrid.displayName = 'CollectionGrid'

export default CollectionGrid
