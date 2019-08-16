import { apiStore, uiStore } from '~/stores'

class CardMoveService {
  constructor({ apiStore, uiStore }) {
    this.apiStore = apiStore
    this.uiStore = uiStore
  }

  static async moveCards(placement) {
    return new this({ apiStore, uiStore }).moveCards(placement)
  }

  static moveErrors() {
    return new this({ apiStore, uiStore }).moveErrors()
  }

  async moveCards(placement) {
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

    const cardIds = [...uiStore.movingCardIds]
    let data = {
      to_id: collectionId,
      from_id: uiStore.movingFromCollectionId,
      collection_card_ids: cardIds,
      placement,
    }

    try {
      uiStore.update('isLoadingMoveAction', true)
      let successMessage
      switch (cardAction) {
        case 'move':
          await apiStore.moveCards(data)
          successMessage = 'Items successfully moved !'
          break
        case 'link':
          await apiStore.linkCards(data)
          successMessage = 'Items successfully linked!'
          break
        case 'duplicate':
          await apiStore.duplicateCards(data)
          successMessage = 'Items successfully duplicated!'
          break
        case 'useTemplate': {
          data = {
            parent_id: data.to_id,
            template_id: data.from_id,
            placement,
          }
          await apiStore.createTemplateInstance(data)
          successMessage = 'Your template instance has been created!'
          break
        }
        default:
          return
      }
      // always refresh the current collection
      // TODO: what if you "moved/duplicated to BOTTOM"?
      await viewingCollection.API_fetchCards()

      uiStore.update('isLoadingMoveAction', false)
      uiStore.popupSnackbar({ message: successMessage })
      uiStore.resetSelectionAndBCT()
      uiStore.closeMoveMenu()
      if (placement === 'beginning') {
        uiStore.scrollToTop()
      } else {
        uiStore.scrollToBottom()
      }
      if (cardAction === 'move') {
        // we actually want to reselect the cards at this point
        uiStore.reselectCardIds(cardIds)
      }
    } catch (e) {
      uiStore.update('isLoadingMoveAction', false)
      let message = 'You cannot move a collection within itself.'
      if (e && e.error && e.error[0]) {
        message = e.error[0]
      }
      uiStore.alert(message)
    }
  }

  moveErrors({ viewingCollection, movingFromCollection, cardAction }) {
    if (!viewingCollection.can_edit_content) {
      return 'You only have view access to this collection. Would you like to keep moving the cards?'
    } else if (
      // don't allow moving cards from templates to non-templates
      cardAction === 'move' &&
      movingFromCollection &&
      movingFromCollection.isMasterTemplate &&
      !viewingCollection.isMasterTemplate
    ) {
      return "You can't move pinned template items out of a template"
    } else if (
      cardAction === 'useTemplate' &&
      viewingCollection.isMasterTemplate
    ) {
      return "You can't create a template instance inside another template. You may be intending to create or duplicate a master template into here instead."
    } else if (
      viewingCollection.isTestCollection ||
      viewingCollection.isTestDesign
    ) {
      return "You can't move cards into a test collection"
    }
    return ''
  }
}

export default CardMoveService
