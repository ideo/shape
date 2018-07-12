import { action, observable } from 'mobx'

import { uiStore } from '~/stores'
import { ITEM_TYPES } from '~/utils/variables'
import Api from './Api'
import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
  attributesForAPI = [
    'order',
    'width',
    'height',
    'reference',
    'parent_id',
    'collection_id',
    'item_id',
    'collection_attributes',
    'item_attributes',
  ]

  @observable maxWidth = this.width
  @observable maxHeight = this.height

  @action setMaxWidth(w) {
    this.maxWidth = w
  }

  @action setMaxHeight(h) {
    this.maxHeight = h
  }

  get isTextItem() {
    return this.record.type === ITEM_TYPES.TEXT
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

  // This sets max W/H based on number of visible columns. Used by Grid + CollectionCover.
  // e.g. "maxWidth" might temporarily be 2 cols even though this card.width == 4
  @action calculateMaxSize(cols) {
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
    uiStore.openBlankContentTool({
      order: this.order,
      width: this.width,
      height: this.height,
      replacingId: this.id,
    })
  }

  async API_create() {
    try {
      const res = await this.apiStore.request('collection_cards', 'POST', { data: this.toJsonApi() })
      this.parent.addCard(res.data)
      uiStore.closeBlankContentTool()
      uiStore.trackEvent('create', this.parent)
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_replace({ replacingId }) {
    try {
      const replacing = this.apiStore.find('collection_cards', replacingId)
      const res = await this.apiStore.request(`collection_cards/${replacingId}/replace`, 'PATCH', { data: this.toJsonApi() })
      this.parent.removeCard(replacing)
      this.parent.addCard(res.data)
      uiStore.closeBlankContentTool()
      uiStore.trackEvent('replace', this.parent)
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_linkToMyCollection() {
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
      uiStore.alertOk('Added to your collection')
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_archive({ isReplacing = false } = {}) {
    const onAgree = async () => {
      const collection = this.parent
      try {
        collection.removeCard(this)
        await this.apiStore.request(`collection_cards/${this.id}/archive`, 'PATCH')

        if (collection.collection_cards.length === 0) {
          uiStore.openBlankContentTool()
        }
        uiStore.trackEvent('archive', collection)
        return true
      } catch (e) {
        uiStore.defaultAlertError()
      } finally {
        this.apiStore.fetch('collections', collection.id, true)
      }
      return false
    }
    let prompt = 'Are you sure you want to archive this?'
    const confirmText = 'Archive'
    let iconName = 'Archive'
    if (this.link) {
      iconName = 'Link'
      prompt = 'Are you sure you want to archive this link?'
    }
    uiStore.confirm({
      prompt,
      confirmText,
      iconName,
      onConfirm: onAgree,
    })
  }

  API_duplicate() {
    return Api.duplicate('collection_cards', this)
  }
}
CollectionCard.type = 'collection_cards'

export default CollectionCard
