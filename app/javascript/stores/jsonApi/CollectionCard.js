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

  // This sets max W/H based on number of visible columns. Used by Grid + CollectionCover.
  // e.g. "maxWidth" might temporarily be 2 cols even though this card.width == 4
  @action calculateMaxSize(cols) {
    // e.g. if card.width is 4, but we're at 2 columns, max out at cardWidth = 2
    this.maxWidth = Math.min(cols, this.width)
    // only allow for height of 2 if we are at 4 columns (either 4 or "small 4" layout)
    this.maxHeight = Math.min(cols === 4 ? 2 : 1, this.height)
    // special case for tall cards
    if (this.height === 2 && this.width === 1) {
      this.maxHeight = 2
      if (this.isTextItem && cols <= 1) {
        this.maxHeight = 1
      }
    }
    // special case for large square tiles, they should remain square
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

  async API_create({ isReplacing = false } = {}) {
    try {
      await this.apiStore.request('collection_cards', 'POST', { data: this.toJsonApi() })
      if (!isReplacing) {
        await this.apiStore.fetch('collections', this.parent.id, true)
        uiStore.closeBlankContentTool()
      }
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
        await this.apiStore.request(`collection_cards/${this.id}/archive`, 'PATCH')
        await this.apiStore.fetch('collections', collection.id, true)

        if (collection.collection_cards.length === 0) {
          uiStore.openBlankContentTool()
        }
        if (isReplacing) uiStore.closeBlankContentTool()

        return true
      } catch (e) {
        uiStore.defaultAlertError()
      }
      return false
    }
    if (!isReplacing) {
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
    } else onAgree()
  }

  API_duplicate() {
    return Api.duplicate('collection_cards', this)
  }
}
CollectionCard.type = 'collection_cards'

export default CollectionCard
