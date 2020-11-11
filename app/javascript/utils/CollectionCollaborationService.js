import _ from 'lodash'
import { objectsEqual } from '~/utils/objectUtils'

export default class CollectionCollaborationService {
  // stores can be passed in e.g. for unit testing, but default to the imported ones
  constructor({ collection, loadCollectionCards } = {}) {
    this.collection = collection
    this.apiStore = collection.apiStore
    this.uiStore = collection.uiStore
    this.loadCollectionCards = loadCollectionCards
  }

  async handleReceivedData(updateData, current_editor = {}) {
    const { collection, apiStore } = this
    if (updateData.collection_updated) {
      const previousFilters = collection.activeFilters
      const res = await collection.refetch()
      const updated = res.data
      // use case for challenges, where selected filters may have changed
      if (updated.activeFilters.length !== previousFilters.length) {
        // then we also refetch cards
        this.loadCollectionCards()
      }
      return
    }
    if (updateData.collection_cards_attributes) {
      // e.g. cards were resized or dragged; apply those same updates
      collection.applyRemoteUpdates(updateData)
      if (updateData.collection_cards_attributes) {
        _.each(updateData.collection_cards_attributes, cardData => {
          const card = apiStore.find('collection_cards', cardData.id)
          this.setCollaborator({ card, current_editor })
        })
      }
      return
    }
    if (updateData.card_id) {
      // a card has been created or updated, so fetch that individual card
      const card = await collection.API_fetchCard(updateData.card_id)
      this.setCollaborator({ card, current_editor })
      return
    }
    if (updateData.card_ids) {
      // a card has been created or updated, so fetch those cards
      const cards = collection.API_fetchAndMergeCards(updateData.card_ids)
      _.each(cards, card => {
        this.setCollaborator({ card, current_editor })
      })
      return
    }
    if (updateData.row_updated) {
      // a row has been inserted or removed
      collection.applyRowUpdate(updateData.row_updated)
      return
    }
    if (updateData.archived_card_ids) {
      collection.removeCardIds(updateData.archived_card_ids)
      return
    }
    if (updateData.text_item) {
      const { text_item } = updateData
      if (text_item && text_item.quill_data) {
        this.handleTextItemUpdate(text_item.id, text_item, current_editor)
      }
      if (text_item && text_item.background_color) {
        this.handleTextItemUpdate(text_item.id, text_item, current_editor)
      }
      return
    }
    if (updateData.cards_selected) {
      _.each(updateData.cards_selected, cardId => {
        const card = apiStore.find('collection_cards', cardId)
        this.setCollaborator({ card, current_editor })
      })
    }
    if (updateData.coordinates) {
      const { coordinates } = updateData
      collection.setCollaboratorCursorPosition({
        collaboratorId: current_editor.id,
        coordinates,
      })
    }
    if (updateData.num_viewers_changed) {
      // TODO: update collaborators here?
      // uiStore.update('collaborators' ...)
    }
  }

  setCollaborator({ card, current_editor }) {
    if (_.isEmpty(current_editor)) return

    if (card && !_.isEmpty(card.record)) {
      card.record.setLatestCollaborator(current_editor)
    }
  }

  handleTextItemUpdate = (itemId, item, current_editor) => {
    const { collection, apiStore, uiStore } = this
    const localItem = apiStore.find('items', itemId)
    if (localItem) {
      // update with incoming content UNLESS we are editing that item
      if (
        uiStore.textEditingItem &&
        uiStore.textEditingItem.id === localItem.id
      ) {
        return
      }
      // update the item which will cause it to re-render
      if (!objectsEqual(localItem.quill_data, item.quill_data)) {
        localItem.setLatestCollaborator(current_editor)
        localItem.quill_data = item.quill_data
      }
      if (!objectsEqual(localItem.background_color, item.background_color)) {
        localItem.setLatestCollaborator(current_editor)
        localItem.background_color = item.background_color
        localItem.background_color_opacity = item.background_color_opacity
      }
    } else if (item.parent_collection_card_id) {
      // we don't have the item, it must be a new card that we need to fetch
      collection.API_fetchCard(item.parent_collection_card_id)
    }
  }
}
