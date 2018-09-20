import _ from 'lodash'
import { routingStore, undoStore } from '~/stores'
import trackError from '~/utils/trackError'
import FilestackUpload from '~/utils/FilestackUpload'
import { ITEM_TYPES } from '~/utils/variables'
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

  get canReplace() {
    if (!this.can_edit_content) return false
    return _.includes(
      [ITEM_TYPES.IMAGE, ITEM_TYPES.FILE, ITEM_TYPES.VIDEO],
      this.type
    )
  }

  get pdfCoverUrl() {
    return FilestackUpload.pdfCoverUrl(this.filestack_file.handle)
  }

  get mimeBaseType() {
    return this.filestack_file && this.filestack_file.mimetype.split('/')[0]
  }

  get isGenericFile() {
    return this.filestack_file && this.mimeBaseType !== 'image'
  }

  get isPdfFile() {
    return (
      this.filestack_file && this.filestack_file.mimetype === 'application/pdf'
    )
  }

  get isDownloadable() {
    return this.isGenericFile || this.isPdfFile
  }

  get isImage() {
    return this.filestack_file && this.mimeBaseType === 'image'
  }

  // almost identical to method on Collection.js
  API_updateName(name, addUndo = true) {
    const previousName = this.name
    this.name = name
    undoStore.pushUndoAction({
      apiCall: () => this.API_revertToSnapshot({ name: previousName }),
      redirectPath: { type: 'items', id: this.id },
    })
    const data = this.toJsonApi()
    delete data.relationships
    data.cancel_sync = true
    const apiPath = `items/${this.id}`
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  API_revertToSnapshot(snapshot = {}) {
    _.assign(this, snapshot)
    const data = this.toJsonApi()
    data.cancel_sync = true
    const apiPath = `items/${this.id}`
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  API_updateWithoutSync({ cancel_sync } = {}) {
    const { apiStore } = this
    const data = this.toJsonApi()
    // Turn off syncing when saving the item to not reload the page
    if (cancel_sync) data.cancel_sync = true
    return apiStore
      .request(`items/${this.id}`, 'PATCH', {
        data,
      })
      .catch(err => {
        trackError(err, { name: 'item:update' })
      })
  }
}
Item.type = 'items'
Item.defaults = {
  text_data: '',
  can_edit: false,
}

export default Item
