import { routingStore } from '~/stores'
import { archive } from './shared'
import BaseRecord from './BaseRecord'

class Item extends BaseRecord {
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
