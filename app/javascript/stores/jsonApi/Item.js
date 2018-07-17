import { routingStore } from '~/stores'
import trackError from '~/utils/trackError'
import FilestackUpload from '~/utils/FilestackUpload'
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

  get justText() {
    const temp = document.createElement('div')
    temp.innerHTML = this.content
    const sanitized = temp.textContent || temp.innerText
    return sanitized.replace(/(?:\r\n|\r|\n)/g, '')
  }

  get parentPath() {
    if (this.breadcrumb && this.breadcrumb.length > 1) {
      const [type, id] = this.breadcrumb[this.breadcrumb.length - 2]
      return routingStore.pathTo(type, id)
    }
    return routingStore.pathTo('homepage')
  }

  get pdfCoverUrl() {
    return FilestackUpload.pdfCoverUrl(this.filestack_file.handle)
  }

  API_updateWithoutSync({ cancel_sync } = {}) {
    const { apiStore } = this
    const data = this.toJsonApi()
    // Turn off syncing when saving the item to not reload the page
    if (cancel_sync) data.cancel_sync = true
    return apiStore.request(`items/${this.id}`, 'PATCH', {
      data,
    })
      .catch(err => { trackError(err, { name: 'item:update' }) })
  }
  API_archive() {
    return Api.archive('items', this)
  }

  API_duplicate() {
    return Api.duplicate('items', this)
  }
}
Item.type = 'items'
Item.defaults = {
  text_data: '',
  can_edit: false,
}

export default Item
