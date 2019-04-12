import _ from 'lodash'
import { action, observable } from 'mobx'

import { ITEM_TYPES, COLLECTION_TYPES } from '~/utils/variables'
import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
  static type = 'collection_cards'
  static endpoint = apiUrl('collection_cards')

  attributesForAPI = [
    'type',
    'order',
    'width',
    'height',
    'row',
    'col',
    'reference',
    'parent_id',
    'collection_id',
    'item_id',
    'collection_attributes',
    'item_attributes',
    'image_contain',
    'is_cover',
    'hidden',
    'filter',
  ]

  batchUpdateAttributes = ['id', 'order', 'width', 'height', 'row', 'col']

  @observable
  maxWidth = this.width
  @observable
  maxHeight = this.height

  @action
  setMaxWidth(w) {
    this.maxWidth = w
  }

  @action
  setMaxHeight(h) {
    this.maxHeight = h
  }

  get isTestDesignCollection() {
    return this.record.type === COLLECTION_TYPES.TEST_DESIGN
  }

  get isTextItem() {
    return this.record && this.record.type === ITEM_TYPES.TEXT
  }

  get isPinned() {
    return this.pinned
  }

  get isPinnedInTemplate() {
    return this.pinned && !this.pinned_and_locked
  }

  get isPinnedAndLocked() {
    // pinned in a collection means it is locked in that place
    // i.e. pinned in a templated collection
    return this.pinned_and_locked
  }

  get parentCollection() {
    if (this.parent) return this.parent
    if (this.parent_id) {
      return this.apiStore.find('collections', this.parent_id)
    }
    // `null` parent may result in an error depending on what you're trying to do
    return null
  }

  // This sets max W/H based on number of visible columns. Used by Grid + CollectionCover.
  // e.g. "maxWidth" might temporarily be 2 cols even though this card.width == 4
  @action
  calculateMaxSize(cols) {
    // max out width to the number of columns
    this.maxWidth = Math.min(cols, this.width)
    // generally only allow cards with height of 2 if we are displaying 4 columns
    this.maxHeight = Math.min(cols === 4 ? 2 : 1, this.height)
    // special case for tall cards, allow them to remain tall
    if (this.height === 2 && this.width === 1) {
      this.maxHeight = 2
      // except for text items at 1 column size, always shrink to 1x1
      if (this.isTextItem && cols <= 1) {
        this.maxHeight = 1
      }
    }
    // special case for large square tiles, they should remain at a square ratio
    if (this.width === this.height && this.width > 1) {
      if (cols === 1) {
        this.maxWidth = 1
        this.maxHeight = 1
      } else if (cols === 2) {
        this.maxWidth = 2
        this.maxHeight = 2
      }
    }
    return {
      cardWidth: this.maxWidth,
      cardHeight: this.maxHeight,
    }
  }

  beginReplacing() {
    this.uiStore.openBlankContentTool({
      order: this.order,
      row: this.row,
      col: this.col,
      width: this.width,
      height: this.height,
      replacingId: this.id,
    })
  }

  async API_create() {
    const { uiStore } = this
    try {
      const res = await this.apiStore.request('collection_cards', 'POST', {
        data: this.toJsonApi(),
      })
      // important to close BCT before adding the new card so that the grid reflows properly
      uiStore.closeBlankContentTool({ force: true })
      this.parentCollection.addCard(res.data)
      uiStore.trackEvent('create', this.parentCollection)
      return res.data
    } catch (e) {
      uiStore.defaultAlertError()
      return false
    }
  }

  async API_replace({ replacingId }) {
    const { uiStore } = this
    try {
      // NOTE: in this context, `this` is a new CollectionCard model
      // that has the data we want to send for replacing the card
      const replacing = this.apiStore.find('collection_cards', replacingId)
      const data = this.toJsonApi()
      // need to remove the item to reset its type (in case it changed)
      this.apiStore.remove(replacing.record)
      const res = await this.apiStore.request(
        `collection_cards/${replacingId}/replace`,
        'PATCH',
        { data }
      )
      uiStore.closeBlankContentTool()
      uiStore.trackEvent('replace', this.parentCollection)
      // can get rid of this temp model
      this.apiStore.remove(this)
      return res.data
    } catch (e) {
      console.warn(e)
      uiStore.defaultAlertError()
      return false
    }
  }

  async API_destroy() {
    const { uiStore } = this
    try {
      this.destroy()
      this.parentCollection.removeCard(this)
      return
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_linkToMyCollection() {
    const { uiStore } = this
    const viewingCollectionId = uiStore.viewingCollection
      ? uiStore.viewingCollection.id
      : this.parent_id
    const data = {
      to_id: this.apiStore.currentUser.current_user_collection_id,
      from_id: viewingCollectionId,
      collection_card_ids: [this.id],
      placement: 'end',
    }
    try {
      await this.apiStore.request('collection_cards/link', 'POST', data)
      if (this.record && !this.record.inMyCollection) {
        this.apiStore.checkInMyCollection(this.record)
      }
      uiStore.alertOk('Added to your collection')
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  reselectOnlyEditableCards(cardIds) {
    const { uiStore } = this
    const filteredCardIds = this.apiStore
      .findAll('collection_cards')
      .filter(
        card =>
          cardIds.indexOf(card.id) > -1 && (card.record && card.record.can_edit)
      )
      .map(card => card.id)
    const removedCount = uiStore.selectedCardIds.length - filteredCardIds.length
    uiStore.reselectCardIds(filteredCardIds)
    return removedCount
  }

  // Only show archive popup if this is a collection that has cards
  // Don't show if empty collection, or just link card / item card(s)
  get shouldShowArchiveWarning() {
    if (this.parentCollection.isMasterTemplate)
      return this.parentCollection.shouldShowEditWarning
    return _.some(
      this.selectedCards,
      card =>
        // look for any records you can't edit, that way this will trigger reselectOnlyEditableCards()
        !card.record.can_edit ||
        // otherwise warn for collections w/ cards
        (!card.link &&
          card.record.className === 'Collection' &&
          card.record.collection_card_count > 0)
    )
  }

  get selectedCards() {
    const { selectedCardIds } = this.uiStore
    return this.apiStore
      .findAll('collection_cards')
      .filter(card => selectedCardIds.indexOf(card.id) > -1)
  }

  get isSelected() {
    return this.uiStore.selectedCardIds.indexOf(this.id) > -1
  }

  get isBeingMoved() {
    const { movingCardIds, cardAction } = this.uiStore
    // only count "being moved" for the move actions (not link, duplicate, etc)
    if (!_.includes(['move', 'moveWithinCollection'], cardAction)) return false
    return movingCardIds.indexOf(this.id) > -1
  }

  get isBeingMultiMoved() {
    const { uiStore } = this
    return uiStore.multiMoveCardIds.indexOf(this.id) > -1
  }

  get isBeingMultiDragged() {
    return !this.isDragCardMaster && this.isBeingMultiMoved
  }

  get isDragCardMaster() {
    const { uiStore } = this
    return uiStore.dragCardMaster === this.id
  }

  async API_archiveSelf({ undoable = true }) {
    try {
      await this.apiStore.archiveCards({
        cardIds: [this.id],
        collection: this.parentCollection,
        undoable,
      })
      return
    } catch (e) {
      this.uiStore.defaultAlertError()
    }
  }

  async API_archiveCards(cardIds = []) {
    this.uiStore.reselectCardIds(cardIds)
    return this.API_archive()
  }

  // this could really be a static method now that it archives all selected cards
  async API_archive({ isReplacing = false, onCancel = null } = {}) {
    const { uiStore } = this
    const { selectedCardIds } = uiStore
    const collection = this.parentCollection

    if (this.shouldShowArchiveWarning) {
      const popupAgreed = new Promise((resolve, reject) => {
        let prompt = 'Are you sure you want to archive this?'
        const confirmText = 'Archive'
        let iconName = 'Archive'
        let snoozeChecked = null
        let onToggleSnoozeDialog = null
        if (collection.isMasterTemplate) {
          ;({
            snoozeChecked,
            prompt,
            onToggleSnoozeDialog,
          } = collection.confirmEditOptions)
        } else if (selectedCardIds.length > 1) {
          // check if multiple cards were selected
          const removedCount = this.reselectOnlyEditableCards(selectedCardIds)
          prompt = 'Are you sure you want to archive '
          if (selectedCardIds.length > 1) {
            prompt += `these ${selectedCardIds.length} objects?`
          } else {
            prompt += 'this?'
          }
          if (removedCount) {
            prompt += ` ${removedCount} object${
              removedCount > 1 ? 's were' : ' was'
            } not selected due to insufficient permissions.`
          }
        } else if (this.link) {
          iconName = 'Link'
          prompt = 'Are you sure you want to archive this link?'
        } else if (this.isTestDesignCollection) {
          prompt = 'Are you sure you want to archive this test design?'
          prompt += ' It will close your feedback.'
        }
        this.uiStore.confirm({
          prompt,
          confirmText,
          iconName,
          onToggleSnoozeDialog,
          snoozeChecked,
          onCancel: () => {
            if (_.isFunction(onCancel)) {
              onCancel()
            }
            resolve(false)
          },
          onConfirm: () => resolve(true),
        })
      })
      const agreed = await popupAgreed
      if (!agreed) return false
    }
    try {
      await this.apiStore.archiveCards({
        // turn into normal JS array
        cardIds: selectedCardIds.toJS(),
        collection,
      })
      // collection may be undefined e.g. if we're archiving from the header actionmenu
      if (collection) {
        collection.removeCardIds(selectedCardIds)
        uiStore.trackEvent('archive', collection)
        if (
          collection.collection_cards.length === 0 &&
          !collection.isSubmissionsCollection
        ) {
          uiStore.openBlankContentTool()
        }
      }
      uiStore.deselectCards()
      return true
    } catch (e) {
      // re-fetch collection
      if (collection) {
        this.apiStore.fetch('collections', collection.id, true)
      }
      console.warn(e)
      uiStore.defaultAlertError()
    }
    return false
  }
}

export default CollectionCard
