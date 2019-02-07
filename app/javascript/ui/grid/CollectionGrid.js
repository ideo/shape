import PropTypes from 'prop-types'
import { action } from 'mobx'
import { updateModelId } from 'datx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import CollectionSort from '~/ui/grid/CollectionSort'
import Loader from '~/ui/layout/Loader'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import CollectionCard from '~/stores/jsonApi/CollectionCard'

const CARD_HOLD_TIME = 0.4 * 1000

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

const SortContainer = styled.div`
  margin-bottom: 15px;
  margin-left: auto;
  margin-right: 5px;
  margin-top: -15px;
  text-align: right;
`

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
@inject('apiStore', 'routingStore', 'uiStore')
@observer
class CollectionGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cards: [],
      rows: 1,
      hoveringOver: null,
      dragTimeoutId: null,
    }
  }

  componentDidMount() {
    this.initialize(this.props)
  }

  componentWillReceiveProps(nextProps) {
    // TODO: refactor this into componentDidUpdate
    // and only re-initialize under the right conditions (of props changing)
    this.initialize(nextProps)
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  initialize(props) {
    const cards = this.positionMovingCardsAndBCT(props)
    this.positionCards(cards, { props })
  }

  positionMovingCardsAndBCT(props) {
    const {
      blankContentToolState,
      collection,
      movingCardIds,
      submissionSettings,
      canEditCollection,
    } = props
    // convert observableArray values into a "normal" JS array (equivalent of .toJS())
    // for the sake of later calculations/manipulations
    const cards = [...collection.collection_cards]
    if (movingCardIds) {
      // remove any cards we're moving to make them appear "picked up"
      _.each(movingCardIds, id => _.remove(cards, { id }))
    }
    if (submissionSettings) {
      this.addSubmissionCard(cards)
    }
    const bctOpen =
      blankContentToolState &&
      blankContentToolState.order !== null &&
      blankContentToolState.collectionId === collection.id
    if (bctOpen) {
      // make the BCT appear to the right of the current card
      let { order } = blankContentToolState
      const { height, replacingId, blankType, width } = blankContentToolState
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
        blankType,
        width,
        height,
        order,
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
      if (canEditCollection || blankCard.blankType) {
        // Add the BCT to the array of cards to be positioned, if they can edit
        cards.unshift(blankCard)
      }
    }
    return cards
  }

  addSubmissionCard = cards => {
    const { collection, submissionSettings } = this.props
    if (_.find(cards, { id: 'submission' })) return
    const addSubmissionCard = {
      // this card is -1, BCT that gets added is 0
      order: -1,
      width: 1,
      height: 1,
      id: 'submission',
      cardType: 'submission',
      parent_id: collection.id,
      submissionSettings,
    }
    cards.unshift(addSubmissionCard)
  }

  // --------------------------
  // <Drag related functions>
  // --------------------------
  onResize = (cardId, newSize) => {
    const positionedCard = _.find(this.state.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    const stateCards = [...this.state.cards]
    let placeholder = _.find(stateCards, { id: placeholderKey })
    let repositionCards = false

    if (!placeholder) {
      placeholder = this.createPlaceholderCard(positionedCard, newSize)
      stateCards.push(placeholder)
      repositionCards = true
    }
    if (
      repositionCards ||
      placeholder.width !== newSize.width ||
      placeholder.height !== newSize.height
    ) {
      placeholder.width = newSize.width
      placeholder.height = newSize.height
      this.positionCards(stateCards, {
        dragging: positionedCard.id,
        dragType: 'resize',
      })
    }
  }

  // reset the grid back to its original state
  positionCardsFromProps = () => {
    this.setState({ hoveringOver: null }, () => {
      this.positionCards(this.props.collection.collection_cards)
    })
  }

  onDragOrResizeStop = (cardId, dragType) => {
    const { hoveringOver, cards } = this.state
    const placeholder = _.find(cards, { cardType: 'placeholder' }) || {}
    const original = _.find(cards, { id: placeholder.originalId })
    const { uiStore, collection } = this.props
    this.clearDragTimeout()
    let moved = false
    if (placeholder && original) {
      const fields = ['order', 'width', 'height']
      const placeholderPosition = _.pick(placeholder, fields)
      placeholderPosition.order = Math.ceil(placeholderPosition.order)
      const originalPosition = _.pick(original, fields)
      moved = !_.isEqual(placeholderPosition, originalPosition)
    }

    if (moved) {
      // we want to update this card to match the placeholder
      const { order } = placeholder
      let { width, height } = placeholder
      const updates = { order }
      let undoMessage = 'Card move undone'
      // don't resize the card for a drag, only for an actual resize
      if (dragType === 'resize') {
        // just some double-checking validations
        if (height > 2) height = 2
        if (width > 4) width = 4
        // set up action to undo
        if (original.height !== height || original.width !== width) {
          undoMessage = 'Card resize undone'
        }
        updates.width = width
        updates.height = height
      }
      // TODO add same template confirmation for multi-item moving
      if (uiStore.multiMoveCardIds.length > 0) {
        const multiMoveCards = _.map(
          uiStore.multiMoveCardIds,
          multiMoveCardId => _.find(cards, { id: multiMoveCardId })
        )
        const sortedMovedCards = _.sortBy(multiMoveCards, 'order')
        _.each(sortedMovedCards, (card, idx) => {
          const sortedOrder = updates.order + (idx + 1) * 0.1
          card.order = sortedOrder
        })
        this.props.batchUpdateCollection({
          cards: sortedMovedCards,
          undoMessage,
        })
        this.positionCardsFromProps()
      } else {
        // If a template, warn that any instances will be updated
        const updateCollectionCard = () => {
          // this will assign the update attributes to the card
          this.props.updateCollection({
            card: original,
            updates,
            undoMessage,
          })
          this.positionCardsFromProps()
        }
        const onCancel = () => {
          this.positionCardsFromProps()
        }
        collection.confirmEdit({ onCancel, onConfirm: updateCollectionCard })
      }
    } else if (hoveringOver && hoveringOver.direction === 'right') {
      // the case where we hovered in the drop zone of a collection and now want to move cards + reroute
      const hoveringRecord = hoveringOver.card.record
      this.moveCardsIntoCollection(
        [cardId, ...uiStore.selectedCardIds],
        hoveringRecord
      )
    } else {
      if (uiStore.activeDragTarget) {
        this.moveCardsIntoCollection(
          [cardId, ...uiStore.selectedCardIds],
          uiStore.activeDragTarget.item
        )
      }
      // reset back to normal
      this.positionCardsFromProps()
    }
  }

  async moveCardsIntoCollection(cardIds, hoveringRecord) {
    const { collection, uiStore, apiStore } = this.props
    // timeout is just a stupid thing so that Draggable doesn't complain about unmounting
    setTimeout(() => {
      uiStore.setMovingCards(cardIds, {
        cardAction: 'moveWithinCollection',
      })
      this.setState({ hoveringOver: null }, async () => {
        const data = {
          to_id: hoveringRecord.id,
          from_id: collection.id,
          collection_card_ids: cardIds,
          placement: 'beginning',
        }
        uiStore.update('movingIntoCollection', hoveringRecord)
        await apiStore.moveCards(data)
        uiStore.update('actionAfterRoute', () => {
          uiStore.setMovingCards([])
          uiStore.reselectCardIds(cardIds)
          uiStore.update('movingIntoCollection', null)
        })
        this.props.routingStore.routeTo('collections', hoveringRecord.id)
      })
    })
  }

  onDrag = (cardId, dragPosition) => {
    if (!this.props.canEditCollection) return
    const positionedCard = _.find(this.state.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    let stateCards = [...this.state.cards]
    let placeholder = _.find(stateCards, { id: placeholderKey })
    const hoveringOver = this.findOverlap(cardId, dragPosition)
    if (hoveringOver && hoveringOver.card.isPinnedAndLocked) return
    if (hoveringOver) {
      const previousHoveringOver = this.state.hoveringOver
      const previousHoverOrder = previousHoveringOver
        ? previousHoveringOver.order
        : null
      const hoveringOverChanged =
        hoveringOver.card.order !== previousHoverOrder ||
        hoveringOver.direction !== previousHoveringOver.direction
      // guard clause to exit if we are not hovering over a new card or card zone
      if (!hoveringOverChanged) return
      this.clearDragTimeout()
      // NOTE: currently, only collections trigger this "right" hover zone
      if (
        hoveringOver.direction === 'right' &&
        !this.fakeCardType(hoveringOver.card.cardType)
      ) {
        const dragTimeoutId = setTimeout(() => {
          hoveringOver.holdingOver = true
          this.setHoveringOverProperties(hoveringOver.card, hoveringOver)
          this.setState({ hoveringOver })
        }, CARD_HOLD_TIME)
        this.setState({ dragTimeoutId })
      }

      if (!placeholder) {
        placeholder = this.createPlaceholderCard(positionedCard)
        stateCards.push(placeholder)
      }
      // NOTE: this will modify observable card attrs, for later save/update
      placeholder.order = parseFloat(hoveringOver.card.order) - 0.5
      placeholder.width = hoveringOver.card.width
      placeholder.height = hoveringOver.card.height
    } else {
      this.clearDragTimeout()
    }
    if (!hoveringOver || hoveringOver.direction !== 'left') {
      stateCards = _.reject(stateCards, { cardType: 'placeholder' })
    }

    const { uiStore } = this.props
    this.setState({ hoveringOver }, () => {
      this.positionCards(stateCards, {
        dragging: positionedCard.id,
        otherDrags: uiStore.selectedCardIds,
        dragType: 'hover',
      })
    })
  }

  createPlaceholderCard = (
    original,
    { width = original.width, height = original.height } = {}
  ) => {
    const placeholderKey = `${original.id}-placeholder`
    const data = {
      position: original.position,
      width,
      height,
      // better way to do this??
      order: original.order,
      originalId: original.id,
      cardType: 'placeholder',
      record: original.record,
    }
    const placeholder = new CollectionCard(data)
    updateModelId(placeholder, placeholderKey)
    return placeholder
  }

  removePlaceholderCard = cards => {
    _.reject(cards, { cardType: 'placeholder' })
  }

  findOverlap = (cardId, dragPosition) => {
    let hoveringOver = null
    const { dragX, dragY } = dragPosition
    const { gutter, gridW } = this.props
    _.each(this.state.cards, card => {
      if (card.isBeingMultiMoved) return null
      const placeholder =
        card.cardType === 'placeholder' || card.cardType === 'blank'
      if (card.id === cardId || placeholder) return null
      // only run this check if we're within the reasonable row bounds
      const { position } = card
      const sameRow =
        dragY >= position.yPos - gutter * 0.5 &&
        dragY <= position.yPos + position.height

      const withinCard =
        dragX >= position.xPos - gutter * 2 &&
        dragX <= position.xPos + position.width - gutter
      if (sameRow && withinCard) {
        const { order, record } = card
        // approx 70px at full width
        const leftAreaSize = gridW * 0.23
        let direction = 'left'
        if (card.record && card.record.internalType === 'collections') {
          // only collections have a "hover right" area
          direction = dragX >= position.xPos + leftAreaSize ? 'right' : 'left'
        }
        hoveringOver = {
          order,
          direction,
          card,
          record,
        }
        // exit early
        return false
      }
      return null
    })
    return hoveringOver
  }

  setHoveringOverProperties = (card, hoveringOver) => {
    card.hoveringOver = false
    card.holdingOver = false
    if (hoveringOver) {
      // check if the card is being currently hovered over
      if (card.id === hoveringOver.card.id) card.hoveringOver = hoveringOver
      card.holdingOver =
        card.id === hoveringOver.card.id &&
        hoveringOver.direction === 'right' &&
        hoveringOver.holdingOver
    }
  }

  clearDragTimeout = () => {
    if (this.state.dragTimeoutId) {
      clearTimeout(this.state.dragTimeoutId)
      this.setState({ dragTimeoutId: null })
    }
  }

  // --------------------------
  // </end Drag related functions>
  // --------------------------

  // empty card acts as a spacer to always show the last row even if empty,
  // and to show a GridCardHotspot to the left when it's the first item in the empty row
  addEmptyCard = cards => {
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

  addPaginationCard = cards => {
    if (_.find(cards, { id: 'pagination' })) return
    let order = cards.length
    const max = _.maxBy(cards, 'order')
    if (max) order = max.order + 1
    const paginationCard = {
      id: 'pagination',
      cardType: 'pagination',
      width: 1,
      height: 1,
      order,
    }
    cards.push(paginationCard)
  }

  // Sorts cards and sets state.cards after doing so
  @action
  positionCards = (collectionCards = [], opts = {}) => {
    // even though hidden cards are not loaded by default in the API, we still filter here because
    // it's possible that some hidden cards were loaded in memory via the CoverImageSelector
    const cards = [...collectionCards].filter(c => !c.hidden)
    // props might get passed in e.g. nextProps for componentWillReceiveProps
    if (!opts.props) opts.props = this.props
    const { collection, gridW, gridH, gutter, cols, addEmptyCard } = opts.props
    const { currentOrder } = collection
    let row = 0
    const matrix = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))
    if (collection.hasMore) this.addPaginationCard(cards)
    if (addEmptyCard) this.addEmptyCard(cards)
    let sortedCards = cards
    if (currentOrder === 'order') {
      // For most collections, we will be sorting by `order`. In that case we call
      // `sortBy` in order to sort our placeholder/blank cards in the correct order.
      // NOTE: If we ever have something like "sort by updated_at" + the ability to pop open BCT,
      // we may need to amend this
      sortedCards = _.sortBy(cards, 'order')
    }
    _.each(sortedCards, (card, i) => {
      // we don't actually want to "re-position" the dragging card
      // because its position is being determined by the drag (i.e. mouse cursor)
      if (opts.dragging === card.id) {
        return
      }

      // if we're dragging multiple cards, also don't show them
      if (opts.dragging && card.isBeingMultiMoved) {
        card.position = {}
        return
      }
      let position = {}
      let filled = false
      // find an open row that can fit the current card
      // NOTE: row limit check is to catch any bad calculations with resizing/moving
      while (!filled && row < 500) {
        let itFits = false
        let nextX = 0
        let cardWidth = card.width
        let cardHeight = card.height
        if (card.calculateMaxSize) {
          // card.calculateMaxSize won't be defined for blank/placeholder cards
          ;({ cardWidth, cardHeight } = card.calculateMaxSize(cols))
        }
        // go through the row and see if there is an empty gap that fits cardWidth
        const gaps = groupByConsecutive(matrix[row], null)
        const maxGap = _.find(gaps, g => g.length >= cardWidth) || {
          length: 0,
        }
        if (maxGap && maxGap.length) {
          ;[nextX] = maxGap
          itFits = true
        } else {
          // 2-COLUMN SPECIAL CASE FOR TEXT CARD:
          // - card is (2+)x1 or 1x2 text item and there is a gap of 1 remaining on this row
          // - shrink card to 1x1 to fit on the row.
          const shouldBackfillSmallGap =
            card.isTextItem &&
            // here we actually check against the card's original dimensions, not its constraints
            ((card.width >= 2 && card.height === 1) ||
              (card.height === 2 && card.width === 1)) &&
            cols === 2 &&
            maxGap.length === 1
          if (shouldBackfillSmallGap) {
            cardWidth = 1
            card.setMaxWidth(1)
            itFits = true
            if (cardHeight === 2) {
              cardHeight = 1
              card.setMaxHeight(1)
            }
            ;[nextX] = maxGap
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
          const canFitOneRow =
            prevCard &&
            prevCard.isTextItem &&
            maxGap.length > 0 &&
            prevCard.position.x === 0 &&
            prevCard.maxHeight === 1
          const canFitTwoRows =
            prevCard &&
            prevCard.isTextItem &&
            prevCard.maxHeight === 2 &&
            row >= 1 &&
            matrix[row][1] === null &&
            matrix[row - 1][1] === null
          const shouldShrinkOneRow =
            prevCard &&
            prevCard.isTextItem &&
            prevCard.maxHeight === 2 &&
            matrix[row][0] === null
          const shouldShrinkPrevPrevOneRow =
            prevPrevCard &&
            prevPrevCard.isTextItem &&
            prevPrevCard.maxHeight === 2 &&
            matrix[row][1] === null
          if (canFitOneRow || canFitTwoRows) {
            prevCard.setMaxWidth(2)
            prevCard.position.width = 2 * (gridW + gutter) - gutter
          } else if (shouldShrinkOneRow) {
            prevCard.setMaxHeight(1)
            prevCard.position.height = 1 * (gridH + gutter) - gutter
            itFits = true
            nextX = 0
          } else if (shouldShrinkPrevPrevOneRow) {
            prevPrevCard.setMaxHeight(1)
            prevPrevCard.position.height = 1 * (gridH + gutter) - gutter
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
            y: row,
          }
          _.assign(position, {
            xPos: position.x * (gridW + gutter),
            yPos: position.y * (gridH + gutter),
            width: cardWidth * (gridW + gutter) - gutter,
            height: cardHeight * (gridH + gutter) - gutter,
          })

          // add position attrs to card
          card.position = position
          this.setHoveringOverProperties(card, this.state.hoveringOver)

          // when we're moving/hovering, placeholders should not take up any space
          const hoverPlaceholder =
            opts.dragType === 'hover' && card.cardType === 'placeholder'
          if (!hoverPlaceholder) {
            // fill rows and columns
            _.fill(matrix[row], card.id, position.x, position.x + cardWidth)
            for (let y = 1; y < cardHeight; y += 1) {
              if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
              _.fill(
                matrix[row + y],
                card.id,
                position.x,
                position.x + cardWidth
              )
            }
            if (_.last(matrix[row]) === card.id) {
              row += 1
              if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
            }
          }
        } else {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      }
    })
    // update cards in state
    this.setState(
      {
        cards,
        rows: matrix.length,
      },
      () => {
        if (_.isFunction(opts.onMoveComplete)) opts.onMoveComplete()
      }
    )
  }

  fakeCardType = cardType =>
    // "fake" cards are the placeholder ones we create
    _.includes(['placeholder', 'blank', 'empty', 'pagination'], cardType)

  renderPositionedCards = () => {
    const grid = []
    const { collection, canEditCollection, routingStore, uiStore } = this.props
    let i = 0
    // unnecessary? we seem to need to preserve the array order
    // in order to not re-draw divs (make transform animation work)
    // so that's why we do this second pass to actually create the divs in their original order
    _.each(this.state.cards, card => {
      i += 1
      let record = {}
      let { cardType } = card
      if (!this.fakeCardType(cardType)) {
        // TODO: some kind of error catch if no record?
        if (card.record) {
          ;({ record } = card)
          // getRecordType gets either 'items' or 'collections'
          cardType = card.record.internalType
        }
      }
      const { cardMenuOpen } = uiStore
      if (!card.position) return
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
          hoveringOverLeft={
            card.hoveringOver && card.hoveringOver.direction === 'left'
          }
          hoveringOverRight={
            card.hoveringOver && card.hoveringOver.direction === 'right'
          }
          holdingOver={!!card.holdingOver}
          onDragOrResizeStop={this.onDragOrResizeStop}
          onResize={this.onResize}
          onResizeStop={this.onResizeStop}
          routeTo={routingStore.routeTo}
          parent={collection}
          menuOpen={cardMenuOpen.id === card.id}
          lastPinnedCard={
            card.isPinnedAndLocked && i === this.state.cards.length - 1
          }
        />
      )
    })
    return grid
  }

  render() {
    const { sorting, uiStore, collection } = this.props
    const { gridSettings } = uiStore
    const { rows } = this.state
    if (uiStore.isLoading || collection.reloading) return <Loader />

    const minHeight = rows * (gridSettings.gridH + gridSettings.gutter)

    return (
      <StyledGrid minHeight={minHeight}>
        {sorting && (
          <SortContainer>
            <CollectionSort collection={collection} />
          </SortContainer>
        )}
        {this.renderPositionedCards()}
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
}

CollectionGrid.propTypes = {
  ...gridConfigProps,
  updateCollection: PropTypes.func.isRequired,
  batchUpdateCollection: PropTypes.func.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  blankContentToolState: MobxPropTypes.objectOrObservableObject,
  cardProperties: MobxPropTypes.arrayOrObservableArray.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  movingCardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  addEmptyCard: PropTypes.bool,
  submissionSettings: PropTypes.shape({
    type: PropTypes.string,
    template: MobxPropTypes.objectOrObservableObject,
  }),
  sorting: PropTypes.bool,
}
CollectionGrid.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionGrid.defaultProps = {
  addEmptyCard: true,
  submissionSettings: null,
  blankContentToolState: null,
  sorting: false,
}
CollectionGrid.displayName = 'CollectionGrid'

export default CollectionGrid
