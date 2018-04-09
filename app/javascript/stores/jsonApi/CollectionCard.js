import { action, observable } from 'mobx'

import { uiStore } from '~/stores'
import Api from './Api'
import BaseRecord from './BaseRecord'

class CollectionCard extends BaseRecord {
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
      uiStore.confirm({
        prompt: 'Are you sure you want to archive this?',
        confirmText: 'Archive',
        iconName: 'Archive',
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
