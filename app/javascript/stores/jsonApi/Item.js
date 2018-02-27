import BaseRecord from './BaseRecord'
import { routingStore } from '~/stores'

class Item extends BaseRecord {
  get parentPath() {
    if (this.breadcrumb && this.breadcrumb.length > 1) {
      const [type, id] = this.breadcrumb[this.breadcrumb.length - 2]
      return routingStore.pathTo(type, id)
    }
    return '/'
  }
}
Item.type = 'items'

export default Item
