import { action, observable } from 'mobx'

import { uiStore } from '~/stores'
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

  // this gets set based on number of visible columns, and used by CollectionCover
  @action setMaxWidth(val) {
    this.maxWidth = val
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
      // console.warn(e)
    }
  }

  async API_linkToMyCollection() {
    const data = {
      to_id: this.apiStore.currentUser.current_user_collection_id,
      from_id: uiStore.viewingCollection.id,
      collection_card_ids: this.link ? [this.recordId] : [this.id],
      placement: 'end',
    }
    await this.apiStore.request('collection_cards/link', 'POST', data)
    uiStore.alert({ iconName: 'Ok', prompt: 'Added to your colleciton' })
  }

  async API_archive({ isReplacing = false } = {}) {
    const onAgree = async () => {
      const collection = this.parent
      try {
        await this.apiStore.request(`collection_cards/${this.id}/archive`, 'PATCH')
        await this.apiStore.fetch('collections', collection.id, true)

        if (collection.collection_cards.length === 0) uiStore.openBlankContentTool()
        if (isReplacing) uiStore.closeBlankContentTool()

        return true
      } catch (e) {
        // console.warn(e)
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
