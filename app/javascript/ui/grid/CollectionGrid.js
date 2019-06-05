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
import { objectsEqual } from '~/utils/objectUtils'
import v from '~/utils/variables'

const StyledGrid = styled.div`
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

const pageMargins = () => {
  let xMargin
  if (window.innerWidth >= v.maxWidth) {
    xMargin = (window.innerWidth - v.maxWidth) / 2
  } else {
    // Otherwise use container padding, multiplied to transform to px
    xMargin = v.containerPadding.horizontal * 16
  }
  return {
    x: xMargin,
    y: v.topScrollTrigger,
  }
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
      hoveringOver: false,
      dragTimeoutId: null,
      matrix: [],
    }
  }

  componentDidMount() {
    this.initialize(this.props)
  }

  componentDidUpdate(prevProps) {
    const fields = [
      'cols',
      'gridH',
      'gridW',
      'blankContentToolState',
      'cardProperties',
      'movingCardIds',
      'cardsFetched',
      'submissionSettings',
    ]
    const prevPlucked = _.pick(prevProps, fields)
    const plucked = _.pick(this.props, fields)
    if (!objectsEqual(prevPlucked, plucked)) {
      this.initialize(this.props)
    }
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  initialize(props) {
    const cards = this.positionMovingCardsAndBCT(props)
    this.positionCards(cards)
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
    if (submissionSettings) {
      this.addSubmissionCard(cards)
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
    const { uiStore } = this.props
    uiStore.update('multiMoveCardIds', [])
    this.setState({ hoveringOver: false }, () => {
      this.initialize(this.props)
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

    const multiMoveCards = _.map(uiStore.multiMoveCardIds, multiMoveCardId =>
      _.find(cards, { id: multiMoveCardId })
    )
    if (moved) {
      // we want to update this card to match the placeholder
      const { order } = placeholder
      let { width, height } = placeholder
      let undoMessage = 'Card move undone'
      const updates = []
      const { trackCollectionUpdated } = this.props

      // don't resize the card for a drag, only for an actual resize
      if (dragType === 'resize') {
        // just some double-checking validations
        if (height > 2) height = 2
        if (width > 4) width = 4
        // set up action to undo
        if (original.height !== height || original.width !== width) {
          undoMessage = 'Card resize undone'
        }
        updates.push({
          card: original,
          order,
          width,
          height,
        })
      }
      if (uiStore.multiMoveCardIds.length > 0) {
        // Set order for moved cards so they are between whole integers,
        // and the backend will then take care of setting
        // it properly amongst the entire collection
        const sortedCards = _.sortBy(multiMoveCards, 'order')
        _.each(sortedCards, (card, idx) => {
          const sortedOrder = order + (idx + 1) * 0.1
          updates.push({
            card,
            order: sortedOrder,
          })
        })
      }

      const onConfirm = () => {
        trackCollectionUpdated()
      }
      const onCancel = () => this.positionCardsFromProps()

      // Perform batch update on all cards,
      // and show confirmation if this is a template
      collection.API_batchUpdateCardsWithUndo({
        updates,
        updateAllCards: true,
        undoMessage,
        onConfirm,
        onCancel,
      })
      // this should happen right away, not waiting for the API call (since locally we have the updated cards' positions)
      this.positionCardsFromProps()
    } else if (hoveringOver && hoveringOver.direction === 'right') {
      // the case where we hovered in the drop zone of a collection and now want to move cards + reroute
      const hoveringRecord = hoveringOver.card.record
      uiStore.setMovingCards(uiStore.multiMoveCardIds, {
        cardAction: 'moveWithinCollection',
      })
      if (hoveringRecord.internalType === 'collections') {
        this.setState({ hoveringOver: false }, () => {
          this.moveCardsIntoCollection(uiStore.multiMoveCardIds, hoveringRecord)
        })
      }
    } else {
      if (uiStore.activeDragTarget) {
        const { apiStore } = this.props
        const targetRecord = uiStore.activeDragTarget.item
        if (uiStore.activeDragTarget.item.id === 'homepage') {
          targetRecord.id = apiStore.currentUserCollectionId
        }
        uiStore.setMovingCards(uiStore.multiMoveCardIds, {
          cardAction: 'moveWithinCollection',
        })
        this.moveCardsIntoCollection(uiStore.multiMoveCardIds, targetRecord)
      }
      // reset back to normal
      this.positionCardsFromProps()
    }
  }

  async moveCardsIntoCollection(cardIds, hoveringRecord) {
    this.props.collection.API_moveCardsIntoCollection({
      toCollection: hoveringRecord,
      cardIds,
      onCancel: () => this.positionCardsFromProps(),
      onSuccess: () =>
        this.setState({
          hoveringOver: false,
        }),
    })
  }

  cancelDrag() {
    const { uiStore } = this.props
    uiStore.setMovingCards([])
    uiStore.stopDragging()
    this.positionCardsFromProps()
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
      if (hoveringOver.card.cardType === 'placeholder') {
        if (!placeholder) {
          // the case where we created a new placeholder in findOverlap
          placeholder = hoveringOver.card
          stateCards.push(placeholder)
        }
      }
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
          this.setState({ hoveringOver })
        }, v.cardHoldTime)
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

    this.setState({ hoveringOver }, () => {
      this.positionCards(stateCards, {
        dragging: positionedCard.id,
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
    // NOTE: important to always initialize models supplying apiStore as the collection
    const placeholder = new CollectionCard(data, this.props.apiStore)
    updateModelId(placeholder, placeholderKey)
    return placeholder
  }

  findOverlap = (cardId, dragPosition) => {
    const { dragX, dragY } = dragPosition
    const { gutter, gridW, gridH } = this.props
    const { cards, matrix } = this.state
    let placeholder = _.find(cards, { cardType: 'placeholder' })
    if (placeholder) {
      // always reset this setting, unless we manually position below
      placeholder.skipPositioning = false
    }

    // calculate row/col that we are dragging over (with some padding to account for our desired logic)
    const row = Math.floor((dragY + gutter * 0.5) / (gridH + gutter))
    const col = Math.floor((dragX + gutter * 2) / (gridW + gutter))

    let overlapCardId = null
    if (matrix[row] && matrix[row][col]) {
      // first case: we're directly overlapping an existing card
      overlapCardId = matrix[row][col]
      const overlapped = _.find(cards, { id: overlapCardId })
      const { record, position } = overlapped
      if (overlapped.isBeingMultiMoved) return null
      const isPlaceholder =
        overlapped.cardType === 'placeholder' || overlapped.cardType === 'blank'
      if (overlapped.id === cardId || isPlaceholder) return null

      const leftAreaSize = gridW * 0.23
      let direction = 'left'
      if (record && record.internalType === 'collections') {
        // only collections have a "hover right" area
        direction = dragX >= position.xPos + leftAreaSize ? 'right' : 'left'
      }
      return {
        order: overlapped.order,
        direction,
        card: overlapped,
        record,
      }
    } else if (row >= 0 && row <= matrix.length && col >= 0 && col <= 3) {
      // if we're within the grid, but not over an existing card...
      // we need to actually find the closest card to determine "order"
      const currentRow = matrix[row]
      // [ 1  1  2  2 ]
      // [ 3  4  x  x ]  <--- card 4 is "nearest" our gap
      const rowPortion = _.compact(_.take(currentRow, col + 1))
      const cardsInRow = _.filter(
        cards,
        c => _.includes(rowPortion, c.id) && c.position.y === row
      )
      let near = _.last(cardsInRow)
      if (!near && row > 0) {
        // there is the case where the "nearest" card is sticking down from the previous row
        // [ 1  1  2  3 ]
        // [ 1  1  x  x ]  <--- card 1 is not actually "nearest", should find card 3
        near = _.find(cards, { id: _.last(_.compact(matrix[row - 1])) })
      }
      if (near) {
        if (!placeholder) {
          const positionedCard = _.find(cards, { id: cardId })
          placeholder = this.createPlaceholderCard(positionedCard)
        }
        // update the placeholder attrs to move it to our desired spot.
        placeholder.order = near.order + 0.5
        placeholder.width = 1
        placeholder.height = 1
        // we want to skip positioning in positionCards because we are manually setting x/yPos
        placeholder.skipPositioning = true
        placeholder.position = {
          x: row,
          y: col,
          xPos: col * (gridW + gutter),
          yPos: row * (gridH + gutter),
          width: gridW,
          height: gridH,
        }

        return {
          order: placeholder.order,
          direction: 'left',
          card: placeholder,
          record: null,
        }
      }
    }

    return null
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

  createEmptyCard = (order, id) => {
    const emptyCard = {
      id,
      cardType: 'empty',
      width: 1,
      height: 1,
      order,
      skipPositioning: true,
      visible: false,
    }
    return emptyCard
  }

  addEmptyCards = (cards, matrix) => {
    const { apiStore, uiStore, canEditCollection } = this.props
    const { currentUser } = apiStore
    let previousCell = null
    const encountered = []
    matrix.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell !== null && !_.includes(encountered, cell)) {
          previousCell = cell
          encountered.push(cell)
        } else if (cell === null) {
          const previousCard = cards.find(c => c.id === previousCell)
          if (!previousCard) return
          const order = previousCard.order + 1
          const id = `empty-${order}-${colIdx}-${rowIdx}`
          const emptyCard = this.createEmptyCard(order, id)
          emptyCard.position = this.calculateGridPosition({
            card: emptyCard,
            cardWidth: 1,
            cardHeight: 1,
            position: {
              x: colIdx,
              y: rowIdx,
            },
          })
          cards.push(emptyCard)
        }
      })
    })
    // ---- new user case ---
    // when `show_helper` is enabled
    if (
      !uiStore.blankContentToolIsOpen &&
      currentUser &&
      currentUser.show_helper &&
      canEditCollection
    ) {
      // should find the first one with the highest order...
      const maxOrderEmptyCard = _.maxBy(
        _.filter(cards, { cardType: 'empty' }),
        'order'
      )
      if (maxOrderEmptyCard) maxOrderEmptyCard.visible = true
    }
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

  calculateGridPosition({ card, cardWidth, cardHeight, position }) {
    const { gridW, gridH, gutter } = this.props
    _.assign(position, {
      xPos: position.x * (gridW + gutter),
      yPos: position.y * (gridH + gutter),
      width: cardWidth * (gridW + gutter) - gutter,
      height: cardHeight * (gridH + gutter) - gutter,
    })
    return position
  }

  // Sorts cards and sets state.cards after doing so
  @action
  positionCards = (collectionCards = [], opts = {}) => {
    // even though hidden cards are not loaded by default in the API, we still filter here because
    // it's possible that some hidden cards were loaded in memory via the CoverImageSelector
    const cards = [...collectionCards].filter(c => !c.hidden)
    const {
      collection,
      gridW,
      gridH,
      gutter,
      cols,
      shouldAddEmptyRow,
    } = this.props
    const { currentOrder } = collection
    let row = 0
    const matrix = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))
    if (collection.hasMore) this.addPaginationCard(cards)
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

      if (card.isBeingMoved || card.tempHidden || card.skipPositioning) {
        return
      }

      // if we're dragging multiple cards, also don't show them
      if (opts.dragging && card.isBeingMultiMoved) {
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
          // add position attrs to card
          position = this.calculateGridPosition({
            card,
            cardWidth,
            cardHeight,
            position,
          })
          card.position = position
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

    let rows = matrix.length

    if (!shouldAddEmptyRow && _.isEmpty(_.compact(_.last(matrix)))) {
      // don't add space for an empty row if we don't want it to appear
      // because `rows` gets calculated for minHeight of grid
      rows -= 1
    } else if (shouldAddEmptyRow && !opts.dragging) {
      matrix.push(_.fill(Array(cols), null))
      this.addEmptyCards(cards, matrix)
    }

    // update cards in state
    this.setState(
      {
        cards,
        rows,
        matrix,
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
    const {
      collection,
      canEditCollection,
      routingStore,
      uiStore,
      loadCollectionCards,
    } = this.props
    const { hoveringOver } = this.state
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
      const isHoveringOver =
        hoveringOver && hoveringOver.card && hoveringOver.card.id === card.id
      const isHoldingOver = isHoveringOver && hoveringOver.holdingOver
      const { cardMenuOpen } = uiStore
      if (_.isEmpty(card.position)) return
      const shouldHide = card.isBeingMultiMoved || card.isBeingMoved
      grid.push(
        <MovableGridCard
          key={card.id}
          card={card}
          cardType={cardType}
          canEditCollection={canEditCollection}
          isUserCollection={collection.isUserCollection}
          isSharedCollection={collection.isSharedCollection}
          isBoardCollection={false}
          position={card.position}
          dragOffset={pageMargins()}
          record={record}
          onDrag={this.onDrag}
          hoveringOverLeft={isHoveringOver && hoveringOver.direction === 'left'}
          hoveringOverRight={
            isHoveringOver && hoveringOver.direction === 'right'
          }
          holdingOver={isHoldingOver}
          onDragOrResizeStop={this.onDragOrResizeStop}
          onResize={this.onResize}
          onResizeStop={this.onResizeStop}
          routeTo={routingStore.routeTo}
          parent={collection}
          menuOpen={cardMenuOpen.id === card.id}
          lastPinnedCard={
            card.isPinnedAndLocked && i === this.state.cards.length - 1
          }
          loadCollectionCards={loadCollectionCards}
          hidden={shouldHide}
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
      <StyledGrid data-empty-space-click minHeight={minHeight}>
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
  trackCollectionUpdated: PropTypes.func.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  blankContentToolState: MobxPropTypes.objectOrObservableObject,
  cardProperties: MobxPropTypes.arrayOrObservableArray.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  movingCardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  loadCollectionCards: PropTypes.func.isRequired,
  shouldAddEmptyRow: PropTypes.bool,
  submissionSettings: PropTypes.shape({
    type: PropTypes.string,
    template: MobxPropTypes.objectOrObservableObject,
    enabled: PropTypes.bool,
  }),
  sorting: PropTypes.bool,
}
CollectionGrid.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionGrid.defaultProps = {
  shouldAddEmptyRow: true,
  submissionSettings: null,
  blankContentToolState: null,
  sorting: false,
}
CollectionGrid.displayName = 'CollectionGrid'

export default CollectionGrid
