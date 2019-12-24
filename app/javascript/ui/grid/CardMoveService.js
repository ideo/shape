import _ from 'lodash'
import { runInAction } from 'mobx'
import { apiStore as globalApiStore, uiStore as globalUiStore } from '~/stores'

export default class CardMoveService {
  // stores can be passed in e.g. for unit testing, but default to the imported ones
  constructor({ apiStore = globalApiStore, uiStore = globalUiStore } = {}) {
    this.apiStore = apiStore
    this.uiStore = uiStore
  }

  static async moveCards(placement, overrideData = {}) {
    return new this().moveCards(placement, overrideData)
  }

  static moveErrors() {
    return new this().moveErrors()
  }

  async moveCards(placement, overrideData = {}) {
    const { apiStore, uiStore } = this
    const { viewingCollection, cardAction } = uiStore
    // Viewing collection might not be set, such as on the search page
    if (!viewingCollection) {
      uiStore.alert("You can't move an item here")
      return
    }

    const collectionId = viewingCollection.id
    const movingFromCollection = apiStore.find(
      'collections',
      uiStore.movingFromCollectionId
    )
    const error = this.moveErrors({
      viewingCollection,
      movingFromCollection,
      cardAction,
    })

    if (error) {
      if (!viewingCollection.can_edit_content) {
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

    let data = {
      to_id: collectionId,
      from_id: uiStore.movingFromCollectionId,
      collection_card_ids: [...uiStore.movingCardIds],
      placement,
    }
    _.assign(data, overrideData)
    const toCollection = apiStore.find('collections', data.to_id)

    const movingWithinCollection =
      movingFromCollection === toCollection && cardAction === 'move'

    try {
      uiStore.update('isLoadingMoveAction', true)
      let successMessage
      let res = {}
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
            res = await apiStore.moveCards(data)
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
          res = await apiStore.createTemplateInstance(data)
          successMessage = 'Your template instance has been created!'
          break
        }
        default:
          return
      }
      const { meta } = res
      // if we received a bulk operation placeholder, place that in the collection
      if (meta && meta.placeholder && toCollection === viewingCollection) {
        runInAction(() => {
          toCollection.collection_cards.unshift(res.data)
        })
      } else if (!movingWithinCollection) {
        // always refresh the current collection
        await viewingCollection.API_fetchCards()
      }

      uiStore.update('isLoadingMoveAction', false)
      uiStore.popupSnackbar({ message: successMessage })
      uiStore.resetSelectionAndBCT()
      uiStore.closeMoveMenu()
      if (!uiStore.movingIntoCollection) {
        if (placement === 'beginning') {
          uiStore.scrollToTop()
        } else if (placement === 'end') {
          uiStore.scrollToBottom()
        }
      }
      if (cardAction === 'move' && !uiStore.movingIntoCollection) {
        // we actually want to reselect the cards at this point
        uiStore.reselectCardIds(data.collection_card_ids)
      }
      return true
    } catch (e) {
      uiStore.update('isLoadingMoveAction', false)
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
      _.each(sortedCards, (card, idx) => {
        const sortedOrder = this.calculateOrderForMovingCard(order, idx)
        updates.push({
          card,
          order: sortedOrder,
        })
      })
    }

    // Perform batch update on all cards,
    // and show confirmation if this is a template
    return collection.API_batchUpdateCardsWithUndo({
      updates,
      updateAllCards: true,
      undoMessage,
      onConfirm,
      onCancel,
    })
  }

  calculateOrderForMovingCard = (order, index) => {
    return Math.ceil(order) + index
  }

  moveErrors({ viewingCollection, movingFromCollection, cardAction }) {
    if (!viewingCollection.can_edit_content) {
      return 'You only have view access to this collection. Would you like to keep moving the cards?'
    } else if (cardAction === 'useTemplate' && viewingCollection.isTemplate) {
      return "You can't create a template instance inside another template. You may be intending to create or duplicate a master template into here instead."
    } else if (viewingCollection.isTestCollection) {
      return "You can't move cards into a test collection"
    }
    return ''
  }
}
