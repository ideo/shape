import { routingStore } from '~/stores'
import { archive } from './shared'
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
    'filestack_file_attributes'
  ]

  get parentPath() {
    if (this.breadcrumb && this.breadcrumb.length > 1) {
      const [type, id] = this.breadcrumb[this.breadcrumb.length - 2]
      return routingStore.pathTo(type, id)
    }
    return '/'
  }

  API_archive() {
    return archive('items', this)
  }
}
Item.type = 'items'

export default Item
