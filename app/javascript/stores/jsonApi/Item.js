import _ from 'lodash'
import { observable } from 'mobx'

import { apiUrl } from '~/utils/url'
import { routingStore } from '~/stores'
import trackError from '~/utils/trackError'
import FilestackUpload from '~/utils/FilestackUpload'
import { ITEM_TYPES, DATA_MEASURES } from '~/utils/variables'
import BaseRecord from './BaseRecord'
import SharedRecordMixin from './SharedRecordMixin'

class Item extends SharedRecordMixin(BaseRecord) {
  static type = 'items'
  static endpoint = apiUrl('items')

  // starts null before it is loaded
  @observable
  inMyCollection = null

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
    'data_settings',
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
      [ITEM_TYPES.IMAGE, ITEM_TYPES.FILE, ITEM_TYPES.VIDEO, ITEM_TYPES.LINK],
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

  get canBeSetAsCover() {
    return this.isImage || this.type === ITEM_TYPES.VIDEO
  }

  get isChart() {
    return this.type === ITEM_TYPES.CHART || this.type === ITEM_TYPES.DATA
  }

  get isData() {
    return this.type === ITEM_TYPES.DATA
  }

  get originalImageUrl() {
    const { filestack_file_url } = this
    if (!filestack_file_url) return ''
    return filestack_file_url.replace(/resize=width:[0-9]*,fit:max\//, '')
  }

  get measure() {
    const { data_settings } = this
    if (!data_settings || !data_settings.d_measure) return {}
    const measure = _.find(DATA_MEASURES, { value: data_settings.d_measure })
    if (!measure) return {}
    return measure
  }

  get timeframe() {
    const { data_settings } = this
    if (!data_settings || !data_settings.d_timeframe) return ''
    return data_settings.d_timeframe
  }

  get measureTooltip() {
    const { measure } = this
    return measure.tooltip || measure.name.toLowerCase()
  }

  get collectionFilter() {
    if (!this.data_settings) return null
    return (
      this.data_settings.d_filters &&
      _.find(this.data_settings.d_filters, { type: 'Collection' })
    )
  }

  imageUrl(width = 1200) {
    const { filestack_file_url } = this
    if (!filestack_file_url) return ''
    return filestack_file_url.replace(
      /resize=width:[0-9]*/,
      `resize=width:${width}`
    )
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

Item.defaults = {
  text_data: '',
  can_edit: false,
  data: {
    values: [],
    count: 0,
  },
  data_settings: {
    d_measure: null,
  },
}

export default Item
