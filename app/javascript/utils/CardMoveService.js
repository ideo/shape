import _ from 'lodash'
import { runInAction } from 'mobx'
import { apiStore as globalApiStore, uiStore as globalUiStore } from '~/stores'

export default class CardMoveService {
  // stores can be passed in e.g. for unit testing, but default to the imported ones
  constructor({ apiStore = globalApiStore, uiStore = globalUiStore } = {}) {
    this.apiStore = apiStore
    this.uiStore = uiStore
  }

  static async moveCards(placement, overrideData = {}, topLeftCard = null) {
    return new this().moveCards(placement, overrideData, topLeftCard)
  }

  static moveErrors(opts) {
    return new this().moveErrors(opts)
  }

  async moveCards(placement, overrideData = {}, topLeftCard = null) {
    const { apiStore, uiStore } = this
    const {
      viewingCollection,
      movingFromCollectionId,
      movingCardIds,
      movingIntoCollection,
      cardAction,
      movingCardsOverflow,
    } = uiStore

    let data = {
      to_id: viewingCollection ? viewingCollection.id : null,
      from_id: movingFromCollectionId,
      collection_card_ids: movingCardIds,
      placement,
    }
    _.assign(data, overrideData)
    // always ensure non-observable array, esp. when these same ids are used by UndoStore
    data.collection_card_ids = [...data.collection_card_ids]
    // Viewing collection might not be set, such as on the search page
    if (!data.to_id) {
      uiStore.alert("You can't move an item here")
      return
    }

    const toCollection = apiStore.find('collections', data.to_id)
    const movingFromCollection = apiStore.find('collections', data.from_id)

    const error = this.moveErrors({
      toCollection,
      cardAction,
    })

    if (error) {
      if (!toCollection.can_edit_content) {
        uiStore.confirm({
          prompt: error,
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: () => {},
          onCancel: () => {
            uiStore.setMovingCards([])
            uiStore.update('selectedCardIds', [])
          },
        })
      } else {
        uiStore.alert(error)
      }
      return
    }

    const movingWithinCollection =
      !movingCardsOverflow &&
      movingFromCollection === toCollection &&
      cardAction === 'move'
    try {
      uiStore.update('isLoadingMoveAction', true)
      let successMessage
      let res = {}
      let newCardIds
      switch (cardAction) {
        case 'move':
          if (movingWithinCollection) {
            const order =
              placement === 'beginning'
                ? 0
                : toCollection.collection_card_count + 100
            await this.updateCardsWithinCollection({
              movingIds: data.collection_card_ids,
              collection: toCollection,
              action: 'move',
              placeholder: {
                order,
              },
            })
          } else {
            res = await apiStore.moveCards(data, { topLeftCard })
          }
          successMessage = 'Items successfully moved!'
          break
        case 'link':
          res = await apiStore.linkCards(data)
          successMessage = 'Items successfully linked!'
          break
        case 'duplicate':
          res = await apiStore.duplicateCards(data)
          successMessage = 'Items successfully duplicated!'
          break
        case 'useTemplate': {
          data = {
            parent_id: data.to_id,
            template_id: data.from_id,
            placement,
          }
          res = await apiStore.createTemplateInstance({
            data,
            template: toCollection,
          })
          successMessage = 'Your template instance has been created!'
          break
        }
        default:
          return
      }
      if (cardAction !== 'useTemplate') {
        newCardIds = _.map(res.data, 'id')
      }
      const meta = res.meta || {}
      // if we received a bulk operation placeholder, place that in the collection
      if (meta.placeholder && toCollection === viewingCollection) {
        runInAction(() => {
          toCollection.collection_cards.unshift(res.data)
        })
      } else if (cardAction === 'useTemplate') {
        const { parent_collection_card } = res.data
        const cardRes = await apiStore.fetch(
          'collection_cards',
          parent_collection_card.id,
          true
        )
        viewingCollection.addCard(cardRes.data)
      } else if (
        toCollection === viewingCollection &&
        (cardAction === 'duplicate' || cardAction === 'link')
      ) {
        // this happens in apiStore.moveCards which is why we only do this for dupe/link
        viewingCollection.mergeCards(res.data)
        if (!viewingCollection.isBoard) {
          viewingCollection.API_fetchCardOrders()
        }
      }

      uiStore.update('isLoadingMoveAction', false)
      uiStore.popupSnackbar({ message: successMessage })
      uiStore.resetSelectionAndBCT()
      uiStore.closeMoveMenu()

      if (!movingIntoCollection) {
        if (placement === 'beginning') {
          uiStore.scrollToTop()
        } else if (placement === 'end') {
          uiStore.scrollToBottom()
        }
      }

      if (
        !meta.placeholder &&
        ((cardAction === 'move' && !movingIntoCollection) ||
          cardAction === 'duplicate' ||
          cardAction === 'link')
      ) {
        if (movingWithinCollection) {
          // reselect moved cards
          uiStore.reselectCardIds(data.collection_card_ids)
        } else if (viewingCollection === toCollection && newCardIds) {
          // select newly created cards
          uiStore.reselectCardIds(newCardIds)
        }
      }
      return true
    } catch (e) {
      uiStore.update('isLoadingMoveAction', false)
      uiStore.update('isTransparentLoading', false)
      uiStore.closeMoveMenu()
      let message = 'You cannot move a collection within itself.'
      if (e && e.error && e.error[0]) {
        message = e.error[0]
      }
      uiStore.alert(message)
      return false
    }
  }

  updateCardsWithinCollection({
    movingIds,
    collection,
    action,
    placeholder,
    onConfirm = null,
    onCancel = null,
  }) {
    let undoMessage = 'Card move undone'
    const updates = []
    const { apiStore } = this

    const { order, original } = placeholder
    let { width, height } = placeholder

    // don't resize the card for a drag, only for an actual resize
    if (action === 'resize') {
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
    if (movingIds.length > 0) {
      const movingCards = apiStore
        .findAll('collection_cards')
        .filter(card => _.includes(movingIds, card.id))

      // Set order for moved cards so they are between whole integers,
      // and API_batchUpdateCards will properly set/reorder it amongst the collection
      const sortedCards = _.sortBy(movingCards, 'order')

      let toPinAllMovingCards = false
      if (collection.isMasterTemplate) {
        toPinAllMovingCards = this.calculateToPinAllMovingCards(
          collection,
          order
        )
      }

      _.each(sortedCards, (card, idx) => {
        const sortedOrder = this.calculateOrderForMovingCard(order, idx)
        const update = {
          card,
          order: sortedOrder,
        }
        if (collection.isMasterTemplate) {
          update.pinned = toPinAllMovingCards
        }
        updates.push(update)
      })
    }

    // Perform batch update on all cards,
    // and show confirmation if this is a template
    return collection.API_batchUpdateCardsWithUndo({
      updates,
      // on a board collection we can just update the moving cards
      updateAllCards: !collection.isBoard,
      undoMessage,
      onConfirm,
      onCancel,
    })
  }

  calculateOrderForMovingCard = (order, index) => {
    return Math.ceil(order) + index
  }

  calculateToPinAllMovingCards = (collection, order) => {
    const { sortedCards } = collection
    const hasPinnedCards = _.some(sortedCards, cc => cc.isPinned)
    if (!hasPinnedCards) return false

    const firstMovingCardSortOrder = this.calculateOrderForMovingCard(order, 0)
    const firstMovingCardIndex = _.findIndex(sortedCards, cc => {
      return cc.order === firstMovingCardSortOrder
    })

    if (firstMovingCardIndex === -1)
      return (_.last(sortedCards) && _.last(sortedCards).isPinned) || false
    if (firstMovingCardIndex <= 1) return true // pin card if moving card in tbe beginning or next to a pinned card
    const leftOfFirstMovingCardIndex = firstMovingCardIndex - 1
    const leftOfFirstMovingCard = sortedCards[leftOfFirstMovingCardIndex]
    // copy pinned state of the card to the left of the first moving card
    return leftOfFirstMovingCard.isPinned
  }

  moveErrors({ toCollection, cardAction }) {
    if (!toCollection.can_edit_content) {
      return 'You only have view access to this collection. Would you like to keep moving the cards?'
    } else if (cardAction === 'useTemplate' && toCollection.isTemplate) {
      return "You can't create a template instance inside another template. You may be intending to create or duplicate a master template into here instead."
    } else if (toCollection.isTestCollection) {
      return "You can't move cards into a test collection"
    }
    return ''
  }
}
