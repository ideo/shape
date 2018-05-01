import { routingStore } from '~/stores'
import Api from './Api'
import BaseRecord from './BaseRecord'

class Item extends BaseRecord {
  attributesForAPI = [
    'type',
    'name',
    'content',
    'text_data',
    'url',
    'image',
    'archived',
    'tag_list',
    'filestack_file_attributes',
  ]

  get parentPath() {
    if (this.breadcrumb && this.breadcrumb.length > 1) {
      const [type, id] = this.breadcrumb[this.breadcrumb.length - 2]
      return routingStore.pathTo(type, id)
    }
    return '/'
  }

  API_updateWithoutSync() {
    const { apiStore } = this
    const data = this.toJsonApi()
    // Turn off syncing when saving the item to not reload the page
    data.cancel_sync = true
    apiStore.request(`items/${this.id}`, 'PATCH', {
      data,
    })
  }

  API_archive() {
    return Api.archive('items', this)
  }

  API_duplicate() {
    return Api.duplicate('items', this)
  }
}
Item.type = 'items'

export default Item
