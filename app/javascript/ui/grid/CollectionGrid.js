import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import CornerPositioned from '~/ui/global/CornerPositioned'
import PlusIcon from '~/ui/icons/PlusIcon'
import IconAvatar from '~/ui/global/IconAvatar'
import Loader from '~/ui/layout/Loader'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import { objectsEqual } from '~/utils/objectUtils'
import CardMoveService from '~/utils/CardMoveService'
import { groupByConsecutive } from '~/utils/CollectionGridCalculator'
import v from '~/utils/variables'
import { calculatePageMargins } from '~/utils/pageUtils'

const cardMover = new CardMoveService()

const StyledGrid = styled.div`
  min-height: ${props => props.minHeight}px;
  position: relative;
  width: 100%;
  transition: all 0.5s;

  .react-draggable-dragged:not(.react-draggable-dragging) {
    /* this is to transition the draggable back to its original spot when you let go */
    transition: all 0.5s;
  }
  /* On a large screen, the page needs to be scaled down so it fits on a piece of paper */
  ${({ isLargeScreen }) =>
    isLargeScreen &&
    `
    @media print {
      transform: scale(0.6);
      transform-origin: top left;
    }
  `}
`
StyledGrid.displayName = 'StyledGrid'

// needs to be an observer to observe changes to the collection + items
@inject('apiStore', 'uiStore')
@observer
class CollectionGrid extends React.Component {
  @observable
  cards = []
  @observable
  matrix = []
  @observable
  rows = 1
  dragTimeoutId = null
  draggingId = null

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
      'isMovingCards',
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
      apiStore,
      uiStore,
      blankContentToolState,
      collection,
      movingCardIds,
      submissionSettings,
      canEditCollection,
    } = props
    // convert observableArray values into a "normal" JS array (equivalent of .toJS())
    // for the sake of later calculations/manipulations
    const cards = [...collection.collection_cards]

    if (movingCardIds && movingCardIds.length) {
      const movingCard = apiStore.find(
        'collection_cards',
        _.first(movingCardIds)
      )

      if (!uiStore.isLoadingMoveAction && movingCard) {
        // create the mdlPlaceholder
        // this is the draggable card that sits in the MDL MoveSnackbar so that you can drag it onto the grid
        const mdlPlaceholderCard = this.createPlaceholderCard(movingCard, {
          cardType: 'mdlPlaceholder',
        })

        if (!_.includes(cards, mdlPlaceholderCard)) {
          cards.push(mdlPlaceholderCard)
        }
      }
    }
    const bctOpen =
      blankContentToolState &&
      blankContentToolState.order !== null &&
      blankContentToolState.collectionId === collection.id
    if (bctOpen) {
      // make the BCT appear to the right of the current card
      let { order } = blankContentToolState
      const {
        height,
        replacingId,
        blankType,
        width,
        row,
        col,
      } = blankContentToolState
      if (replacingId) {
        // remove the card being replaced from our current state cards
        _.remove(cards, { id: replacingId })
      } else {
        // BCT is technically "order of hotspot card + 1"
        // so we have to bump it back by 0.5 so it isn't == with the next card
        order -= 0.5
      }
      const blankAttrs = {
        width,
        height,
        order,
        row,
        col,
      }
      let blankCard = {
        ...blankAttrs,
        id: 'blank',
        num: 0,
        cardType: 'blank',
        blankType,
      }
      // If we already have a BCT open, find it in our cards
      const blankFound = _.find(this.cards, { cardType: 'blank' })
      // Look for card in state...
      if (blankFound && blankFound.order !== order) {
        // HACK: `num` just makes it so that BCT can get a new unique `id`
        // otherwise grid thinks the BCT has simply "moved"
        runInAction(() => {
          blankFound.num += 1
          blankFound.id = `blank-${blankFound.num}`
          // Increments order from existing BCT order
          blankCard = { ...blankFound, ...blankAttrs }
        })
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
  // reset the grid back to its original state
  positionCardsFromProps = () => {
    const { uiStore } = this.props
    uiStore.update('multiMoveCardIds', [])
    this.setHoveringOver(false)
    this.initialize(this.props)
  }

  calculateOrderForMovingCard = (order, index) => {
    return Math.ceil(order) + index
  }

  onResize = (cardId, newSize) => {
    const { uiStore } = this.props
    const positionedCard = _.find(this.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    const stateCards = [...this.cards]
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
      uiStore.updatePlaceholderPosition({
        ...placeholder.position,
        order: placeholder.order,
        cardWidth: placeholder.width,
        cardHeight: placeholder.height,
      })
    }
  }

  onDrag = (cardId, dragPosition) => {
    if (!this.props.canEditCollection) return
    const { uiStore } = this.props
    const positionedCard = _.find(this.cards, { id: cardId })
    const stateCards = [...this.cards]
    let placeholder = _.find(stateCards, { cardType: 'placeholder' })
    const hoveringOver = this.findOverlap(cardId, dragPosition)
    if (hoveringOver && hoveringOver.card.isPinnedAndLocked) return
    const previousHoveringOver = this.hoveringOver
    let createdPlaceholder = false
    const hoveringOverChanged =
      _.get(hoveringOver, 'card.id', null) !==
        _.get(previousHoveringOver, 'card.id', null) ||
      _.get(hoveringOver, 'direction', null) !==
        _.get(previousHoveringOver, 'direction', null)

    if (hoveringOver) {
      if (hoveringOver.card.cardType === 'placeholder') {
        if (!placeholder) {
          // the case where we created a new placeholder in findOverlap
          placeholder = hoveringOver.card
          stateCards.push(placeholder)
          createdPlaceholder = true
        }
      }
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
          this.setHoveringOver(hoveringOver)
        }, v.cardHoldTime)
        this.dragTimeoutId = dragTimeoutId
      }

      if (!placeholder) {
        placeholder = this.createPlaceholderCard(positionedCard)
        stateCards.push(placeholder)
        createdPlaceholder = true
      }
    } else {
      this.clearDragTimeout()
    }

    if (!hoveringOver || hoveringOver.direction !== 'left') {
      uiStore.updatePlaceholderPosition({ order: null, card: null })
    }

    if (hoveringOverChanged) {
      this.setHoveringOver(hoveringOver)
    }

    if (this.draggingId !== positionedCard.id || createdPlaceholder) {
      this.draggingId = positionedCard.id
      // only want to call positionCards if we really have to
      this.positionCards(stateCards, {
        dragging: positionedCard.id,
        dragType: 'hover',
      })
    }
    if (_.get(hoveringOver, 'card') && hoveringOverChanged) {
      uiStore.updatePlaceholderPosition({
        ...hoveringOver.card.position,
        order: hoveringOver.card.order,
      })
    }
  }

  onDragOrResizeStop = (cardId, dragType) => {
    const { hoveringOver, cards } = this
    const placeholder = _.find(cards, { cardType: 'placeholder' }) || {}
    const { original } = placeholder
    const { uiStore, collection, trackCollectionUpdated } = this.props
    const { cardAction, movingFromCollectionId, draggingFromMDL } = uiStore
    this.draggingId = null
    this.clearDragTimeout()
    let moved = false

    // multiMoveCardIds = all cards being dragged
    const movingIds = [...uiStore.multiMoveCardIds]
    const movingWithinCollection =
      cardAction === 'move' && movingFromCollectionId === collection.id

    const fields = ['order', 'width', 'height']
    const placeholderPosition = {
      order: uiStore.placeholderPosition.order,
      // height and width should be the cardHeight/Width e.g. "1" and "2" here
      height: uiStore.placeholderPosition.cardHeight,
      width: uiStore.placeholderPosition.cardWidth,
    }

    const placeholderOrder = placeholderPosition.order
    if (placeholderOrder !== null && original) {
      const originalPosition = _.pick(original, fields)
      moved = !_.isEqual(placeholderPosition, originalPosition)
    }

    if (hoveringOver && hoveringOver.direction === 'right') {
      // the case where we hovered in the drop zone of a collection and now want to move cards + reroute
      const hoveringRecord = hoveringOver.card.record
      uiStore.setMovingCards(uiStore.multiMoveCardIds)

      if (hoveringRecord.internalType === 'collections') {
        this.setHoveringOver(false)
        this.moveCardsIntoCollection(movingIds, hoveringRecord)
      }
    } else if (
      dragType === 'drag' &&
      draggingFromMDL &&
      (placeholderOrder !== null &&
        !_.isEmpty(placeholder) &&
        !movingWithinCollection)
    ) {
      cardMover.moveCards(Math.ceil(placeholderOrder))
      this.positionCardsFromProps()
      return
    } else if (moved) {
      // we want to update this card to match the placeholder
      cardMover.updateCardsWithinCollection({
        movingIds,
        collection,
        placeholder: {
          ...placeholderPosition,
          original,
        },
        undoable: true,
        action: dragType,
        onConfirm: () => {
          trackCollectionUpdated()
        },
        onCancel: () => {
          this.positionCardsFromProps()
        },
      })
      // this should happen right away, not waiting for the API call (since locally we have the updated cards' positions)
      this.positionCardsFromProps()
      uiStore.reselectCardIds(movingIds)
    } else {
      if (uiStore.activeDragTarget) {
        const { apiStore } = this.props
        const targetRecord = uiStore.activeDragTarget.item
        if (uiStore.activeDragTarget.item.id === 'homepage') {
          targetRecord.id = apiStore.currentUserCollectionId
        }
        uiStore.setMovingCards(uiStore.multiMoveCardIds)
        this.moveCardsIntoCollection(movingIds, targetRecord)
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
      onSuccess: () => this.setHoveringOver(false),
    })
  }

  get hoveringOver() {
    return this.props.uiStore.hoveringOver
  }

  setHoveringOver(val) {
    const { uiStore } = this.props
    uiStore.setHoveringOver(val)
  }

  isCardReviewable(card) {
    const { apiStore, collection } = this.props
    const { currentUser } = apiStore

    // FIXME: User::API_fetchAllReviewableSubmissions is not implemented
    const reviewableSubmissions = currentUser.API_fetchAllReviewableSubmissions(
      collection
    )

    if (_.isEmpty(reviewableSubmissions)) {
      return false
    }

    _.contains(reviewableSubmissions, card.record)
  }

  cancelDrag() {
    const { uiStore } = this.props
    uiStore.setMovingCards([])
    uiStore.stopDragging()
    this.positionCardsFromProps()
  }

  createPlaceholderCard = (
    originalCard,
    {
      width = originalCard.width,
      height = originalCard.height,
      cardType = `placeholder`,
    } = {}
  ) => {
    let original = originalCard
    if (originalCard.isMDLPlaceholder) {
      // the mdlPlaceholder is really a clone of the original card for dragging purposes;
      // we reference the original as it's the one we actually want to "move"
      original = originalCard.original
    }

    const { apiStore } = this.props
    const placeholderKey = `${original.id}-${cardType}`
    const data = {
      position: original.position,
      width,
      height,
      order: original.order,
      originalId: original.id,
      cardType,
      record: original.record,
    }
    // NOTE: important to always initialize models supplying apiStore as the collection
    const placeholder = new CollectionCard(data, apiStore)
    apiStore.updateModelId(placeholder, placeholderKey)
    return placeholder
  }

  findOverlap = (cardId, dragPosition) => {
    const { dragX, dragY } = dragPosition
    const { gutter, gridW, gridH } = this.props
    const { cards, matrix } = this
    let placeholder = _.find(cards, { cardType: 'placeholder' })

    // calculate row/col that we are dragging over (with some padding to account for our desired logic)
    const row = Math.floor((dragY + gutter * 0.5) / (gridH + gutter))
    const col = Math.floor((dragX + gutter * 2) / (gridW + gutter))

    let overlapCardId = null
    if (matrix.length <= row || (matrix[row] && matrix[row].length <= col))
      return
    if (matrix[row] && matrix[row][col]) {
      // first case: we're directly overlapping an existing card
      if (placeholder && placeholder.skipPositioning) {
        // in this case placeholder is positioned inside the grid
        placeholder.skipPositioning = false
      }

      overlapCardId = matrix[row][col]
      const overlapped = _.find(cards, { id: overlapCardId })
      const { record, position } = overlapped
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
      let near = _.last(_.sortBy(cardsInRow, 'order'))
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
        const newAttrs = {
          // update the placeholder attrs to move it to our desired spot.
          order: near.order + 0.5,
          width: 1,
          height: 1,
          // we want to skip positioning in positionCards because we are manually setting x/yPos
          skipPositioning: true,
          position: {
            x: row,
            y: col,
            xPos: col * (gridW + gutter),
            yPos: row * (gridH + gutter),
            width: gridW,
            height: gridH,
          },
        }
        // we want to be intentional about changing the placeholder's observable attrs,
        // otherwise we can very eagerly trigger too many re-renders
        const oldAttrs = _.pick(placeholder, _.keys(newAttrs))
        if (!objectsEqual(oldAttrs, newAttrs)) {
          runInAction(() => {
            _.assign(placeholder, newAttrs)
          })
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
    if (this.dragTimeoutId) {
      clearTimeout(this.dragTimeoutId)
      this.dragTimeoutId = null
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
    let previousOrder = -1
    const encountered = []
    matrix.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell !== null && !_.includes(encountered, cell)) {
          previousCell = cell
          encountered.push(cell)
        } else if (cell === null) {
          const previousCard = cards.find(c => c.id === previousCell)
          if (previousCard) {
            previousOrder = previousCard.order + 1
          } else {
            previousOrder += 1
          }
          const order = previousOrder
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

  openMobileBct = ev => {
    ev.preventDefault()
    const { uiStore } = this.props
    let order = 0
    const { pageYOffset } = window
    const scrollPoint = Math.max(
      0,
      pageYOffset + window.innerHeight - window.innerHeight / 2
    )
    const { cards } = this
    const closestCard = cards.find(
      card =>
        card.position.yPos < scrollPoint &&
        card.position.yPos + card.position.height > scrollPoint
    )
    if (!closestCard) {
      return uiStore.openBlankContentTool({ order })
    }
    order = closestCard.order
    const newPosition = {
      x: 0,
      y: closestCard.position.y - 1,
    }
    const newGridPosition = this.calculateGridPosition({
      cardWidth: 1,
      cardHeight: 1,
      position: newPosition,
    })
    uiStore.openBlankContentTool({ order })
    if (!this.isVerticallyVisible(newPosition)) {
      uiStore.scrollToPosition(newGridPosition.yPos)
    }
  }

  isVerticallyVisible(position) {
    const winTop = window.pageYOffset
    const winBottom = pageYOffset + window.innerHeight
    const eleBottom = position.yPos + position.height
    const eleTop = position.yPos
    return (
      eleTop >= winTop &&
      eleTop <= winBottom &&
      eleBottom <= winBottom &&
      eleBottom >= winTop
    )
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
    // it's possible that some hidden cards were loaded in memory via the CardCoverEditor
    const cards = _.reject(collectionCards, 'shouldHideFromUI')
    const {
      collection,
      gridW,
      gridH,
      gutter,
      cols,
      shouldAddEmptyRow,
      canEditCollection,
    } = this.props
    const { currentOrder } = collection
    let row = 0
    const matrix = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))
    if (collection.hasMore) {
      // check if we've selected all and moving all the cards,
      // in which case there is no need to try to paginate
      this.addPaginationCard(cards)
    }
    let sortedCards = cards
    if (currentOrder === 'order') {
      // For most collections, we will be sorting by `order`. In that case we call
      // `sortBy` in order to sort our placeholder/blank cards in the correct order.
      // NOTE: If we ever have something like "sort by updated_at" + the ability to pop open BCT,
      // we may need to amend this
      sortedCards = _.sortBy(cards, 'order')
    }
    _.each(sortedCards, (card, i) => {
      let position = {}
      // we don't actually want to "re-position" the dragging card
      // because its position is being determined by the drag (i.e. mouse cursor)
      if (opts.dragging === card.id) {
        return
      }

      if (card.tempHidden || card.skipPositioning) {
        return
      }

      if (card.isMDLPlaceholder) {
        card.position = this.calculateGridPosition({
          card,
          cardWidth: card.width,
          cardHeight: card.height,
          // it needs a position to be valid
          position: { x: 0, y: 0 },
        })
        card.calculateMaxSize(cols)

        return
      }

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
        const hotspotPositionedBCT =
          card.cardType === 'blank' && (card.col || card.row)

        if (maxGap && maxGap.length) {
          ;[nextX] = maxGap
          itFits = true
        } else if (hotspotPositionedBCT) {
          // in this case BCT was absolutely positioned by clicking a Hotspot, we know it fits
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
          if (hotspotPositionedBCT) {
            position.x = card.col
            position.y = card.row
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
    } else if (canEditCollection && !opts.dragging) {
      if (shouldAddEmptyRow) {
        matrix.push(_.fill(Array(cols), null))
      }
      this.addEmptyCards(cards, matrix)
    }

    // update cards in state
    this.cards.replace(cards)
    this.rows = rows
    this.matrix = matrix
    if (_.isFunction(opts.onMoveComplete)) opts.onMoveComplete()
  }

  renderMobileHotspot() {
    const { canEditCollection } = this.props
    if (!canEditCollection) return ''
    return (
      <CornerPositioned>
        <IconAvatar title="Create new item">
          <button
            onClick={this.openMobileBct}
            style={{ width: '70%', height: '70%' }}
          >
            <PlusIcon />
          </button>
        </IconAvatar>
      </CornerPositioned>
    )
  }

  fakeCardType = cardType =>
    // "fake" cards are the placeholder ones we create
    _.includes(['placeholder', 'blank', 'empty', 'pagination'], cardType)

  renderPositionedCards = () => {
    const grid = []
    const { collection, canEditCollection, loadCollectionCards } = this.props
    let i = 0
    _.each(this.cards, card => {
      i += 1
      let record = {}
      let { cardType } = card
      if (!this.fakeCardType(cardType)) {
        // TODO: some kind of error catch if no record?
        if (card.record) {
          ;({ record } = card)
          // internalType gets either 'items' or 'collections'
          cardType = card.record.internalType
        }
      }
      if (_.isEmpty(card.position)) return

      grid.push(
        <MovableGridCard
          key={card.id}
          card={card}
          cardType={cardType}
          upd={card.updated_at}
          canEditCollection={canEditCollection}
          isUserCollection={collection.isUserCollection}
          isSharedCollection={collection.isSharedCollection}
          isBoardCollection={false}
          isReviewable={this.isCardReviewable(card)}
          position={card.position}
          dragOffset={calculatePageMargins()}
          record={record}
          onDrag={this.onDrag}
          onDragOrResizeStop={this.onDragOrResizeStop}
          onResize={this.onResize}
          onResizeStop={this.onResizeStop}
          parent={collection}
          lastPinnedCard={card.isPinnedAndLocked && i === this.cards.length - 1}
          loadCollectionCards={loadCollectionCards}
          searchResult={collection.isSearchResultsCollection}
        />
      )
    })
    return grid
  }

  render() {
    const { uiStore, collection } = this.props
    const { gridSettings } = uiStore
    const { rows } = this
    if (uiStore.isLoading || collection.reloading) return <Loader />

    const minHeight = rows * (gridSettings.gridH + gridSettings.gutter)

    return (
      <StyledGrid
        data-empty-space-click
        minHeight={minHeight}
        isLargeScreen={uiStore.isLargeBreakpoint}
      >
        {this.renderPositionedCards()}
        {uiStore.isMobile && this.renderMobileHotspot()}
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
  movingCardIds: MobxPropTypes.arrayOrObservableArray.isRequired,
  loadCollectionCards: PropTypes.func.isRequired,
  canEditCollection: PropTypes.bool,
  isMovingCards: PropTypes.bool,
  shouldAddEmptyRow: PropTypes.bool,
  submissionSettings: PropTypes.shape({
    type: PropTypes.string,
    template: MobxPropTypes.objectOrObservableObject,
    enabled: PropTypes.bool,
  }),
}
CollectionGrid.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionGrid.defaultProps = {
  shouldAddEmptyRow: true,
  submissionSettings: null,
  blankContentToolState: null,
  canEditCollection: false,
  isMovingCards: false,
}
CollectionGrid.displayName = 'CollectionGrid'

export default CollectionGrid
