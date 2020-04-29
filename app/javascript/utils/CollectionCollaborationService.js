import { objectsEqual } from '~/utils/objectUtils'

export default class CollectionCollaborationService {
  // stores can be passed in e.g. for unit testing, but default to the imported ones
  constructor({ collection } = {}) {
    this.collection = collection
    this.apiStore = collection.apiStore
    this.uiStore = collection.uiStore
  }

  handleReceivedData(updateData) {
    const { collection } = this
    if (updateData.collection_updated) {
      collection.refetch()
      return
    }
    if (updateData.collection_cards_attributes) {
      // e.g. cards were resized or dragged; apply those same updates
      collection.applyRemoteUpdates(updateData)
      return
    }
    if (updateData.card_id) {
      // a card has been created or updated, so fetch that individual card
      this.fetchCard(updateData.card_id)
      return
    }
    if (updateData.card_ids) {
      // a card has been created or updated, so fetch those cards
      collection.API_fetchAndMergeCards(updateData.card_ids)
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
        this.handleTextItemUpdate(text_item.id, text_item)
      }
      return
    }
    if (updateData.num_viewers_changed) {
      // TODO: update collaborators
      // uiStore.update('collaborators' ...)
    }
  }

  handleTextItemUpdate = (itemId, item) => {
    const { apiStore, uiStore } = this
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
        localItem.quill_data = item.quill_data
      }
    } else if (item.parent_collection_card_id) {
      // we don't have the item, it must be a new card that we need to fetch
      this.fetchCard(item.parent_collection_card_id)
    }
  }

  async fetchCard(cardId) {
    const { collection, apiStore } = this
    const res = await apiStore.fetch('collection_cards', cardId, true)
    // make sure it's in our current collection
    collection.addCard(res.data)
  }
}
