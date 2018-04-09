import { routingStore } from '~/stores'
import Api from './Api'
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
    return Api.archive('items', this)
  }

  API_duplicate() {
    return Api.duplicate('items', this)
  }
}
Item.type = 'items'

export default Item
