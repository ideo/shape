import _ from 'lodash'
import { observable } from 'mobx'
import { ReferenceType } from 'datx'

import { apiUrl } from '~/utils/url'
import trackError from '~/utils/trackError'
import FilestackUpload from '~/utils/FilestackUpload'
import { ITEM_TYPES, DATA_MEASURES } from '~/utils/variables'
import BaseRecord from './BaseRecord'
import Role from './Role'
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
    'quill_data',
    'url',
    'image',
    'archived',
    'tag_list',
    'thumbnail_url',
    'filestack_file_attributes',
    'report_type',
    'selected_measures',
  ]

  get justText() {
    const temp = document.createElement('div')
    temp.innerHTML = this.content
    const sanitized = temp.textContent || temp.innerText
    return sanitized.replace(/(?:\r\n|\r|\n)/g, '')
  }

  get canReplace() {
    if (!this.can_edit_content) return false
    return _.includes(
      [
        ITEM_TYPES.IMAGE,
        ITEM_TYPES.FILE,
        ITEM_TYPES.VIDEO,
        ITEM_TYPES.LINK,
        ITEM_TYPES.EXTERNAL_IMAGE,
      ],
      this.type
    )
  }

  get isMedia() {
    return this.isImage || this.isVideo
  }

  get isReportTypeCollectionsItems() {
    return this.report_type === 'report_type_collections_and_items'
  }

  get isReportTypeNetworkAppMetric() {
    return this.report_type === 'report_type_network_app_metric'
  }

  get isReportTypeRecord() {
    return this.report_type === 'report_type_record'
  }

  get isReportTypeQuestionItem() {
    return this.report_type === 'report_type_question_item'
  }

  get isCustomizableQuestionType() {
    return (
      this.question_type === 'question_single_choice' ||
      this.question_type === 'question_multiple_choice'
    )
  }

  get isSingleChoiceQuestion() {
    return this.question_type === 'question_single_choice'
  }

  get pdfCoverUrl() {
    if (!this.filestack_file) return ''
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

  get isLegend() {
    return this.type === ITEM_TYPES.LEGEND
  }

  get isDownloadable() {
    return this.isGenericFile || this.isPdfFile
  }

  get isImage() {
    return (
      this.type === ITEM_TYPES.EXTERNAL_IMAGE ||
      (this.filestack_file && this.mimeBaseType === 'image')
    )
  }

  get isText() {
    return this.type === ITEM_TYPES.TEXT
  }

  get isChart() {
    return this.type === ITEM_TYPES.CHART || this.type === ITEM_TYPES.DATA
  }

  get isData() {
    return this.type === ITEM_TYPES.DATA
  }

  get isVideo() {
    return (
      this.type === ITEM_TYPES.VIDEO ||
      (this.filestack_file && this.mimeBaseType === 'video')
    )
  }

  get isLink() {
    return this.type === ITEM_TYPES.LINK
  }

  get canBeSetAsCover() {
    return this.isImage
  }

  get canSetACover() {
    return this.isVideo || this.isLink
  }

  get subtitle() {
    if (this.subtitle_hidden) {
      return ''
    }
    return this.content
  }

  get subtitleHidden() {
    return this.subtitle_hidden
  }

  fileUrl() {
    const { filestack_handle } = this
    if (!filestack_handle) return ''
    return FilestackUpload.fileUrl({
      handle: filestack_handle,
    })
  }

  imageUrl(filestackOpts = {}) {
    if (this.type === ITEM_TYPES.EXTERNAL_IMAGE) {
      return this.url
    }
    const { filestack_file, filestack_handle } = this
    if (!filestack_handle) return ''
    let mimetype = ''
    if (filestack_file) {
      mimetype = filestack_file.mimetype
    }
    return FilestackUpload.imageUrl({
      handle: filestack_handle,
      mimetype,
      filestackOpts,
    })
  }

  get primaryDataset() {
    const { datasets } = this
    if (!datasets) return null
    if (datasets.length <= 1) return datasets[0]
    const primary = datasets.find(dataset => dataset.order === 0)
    return primary
  }

  secondaryDatasets = ({ selected } = { selected: true }) => {
    const { datasets } = this
    if (!datasets) return []
    const allDatasets = this.datasets.filter(
      dataset => dataset.order !== 0 && dataset.selected === selected
    )
    return allDatasets
  }

  get measure() {
    const { name } = this
    const { measure } = this.primaryDataset
    if (!measure)
      return {
        name,
      }
    const shapeMeasure = _.find(DATA_MEASURES, { value: measure })
    if (shapeMeasure) return shapeMeasure
    return {
      name: _.capitalize(measure),
    }
  }

  get legendItem() {
    const { legend_item_id } = this
    if (!legend_item_id) return null
    return this.apiStore.find('items', legend_item_id.toString())
  }

  get timeframe() {
    const { timeframe } = this.primaryDataset
    return timeframe || ''
  }

  get measureTooltip() {
    return this.measure.tooltip || this.measure.name.toLowerCase()
  }

  // not used any more??
  get collectionFilter() {
    if (!this.primaryDataset) return null
    return _.find(this.primaryDataset.data_source_id, { type: 'Collection' })
  }

  API_updateWithoutSync({ cancel_sync = false, highlight = false } = {}) {
    const { apiStore } = this
    const data = this.toJsonApi()
    // Turn off syncing when saving the item to not reload the page
    if (cancel_sync) data.cancel_sync = true
    let endpoint = `items/${this.id}`
    if (highlight) endpoint += '/highlight'

    return apiStore
      .request(endpoint, 'PATCH', {
        data,
      })
      .catch(err => {
        trackError(err, { name: 'item:update' })
      })
  }

  API_pingCollection() {
    return this.apiStore.request(`items/${this.id}/ping_collection`)
  }

  API_createQuestionChoice(choiceData) {
    return this.apiStore.request(
      `items/${this.id}/question_choices/`,
      'POST',
      choiceData
    )
  }

  API_destroyQuestionChoice(choice) {
    return this.apiStore.request(
      `items/${this.id}/question_choices/${choice.id}`,
      'DELETE'
    )
  }

  API_archiveQuestionChoice(choice) {
    return this.apiStore.request(
      `items/${this.id}/question_choices/${choice.id}/archive`,
      'POST'
    )
  }

  async API_persistHighlight({ commentId, delta } = {}) {
    // pick up "new" highlights that are currently in our quillEditor
    _.each(delta.ops, op => {
      if (op.attributes && op.attributes.commentHighlight === 'new') {
        op.attributes = {
          // replace them with persisted comment id
          commentHighlight: commentId,
        }
      }
    })
    // now set this local quill_data to have the new highlight + commentId
    this.quill_data = delta
    await this.API_updateWithoutSync({
      cancel_sync: true,
      highlight: true,
    })
    return
  }

  // NOTE: this may be unnecessary now, based on how we now clear out new highlights
  removeNewHighlights = (delta = this.quill_data) => {
    let justAddedHighlight = false
    _.each(delta.ops, op => {
      // don't persist any unpersisted comment highlights
      if (op.attributes && op.attributes.commentHighlight === 'new') {
        justAddedHighlight = true
        delete op['attributes']
      }
    })
    return justAddedHighlight
  }

  hasHighlightFormatting = (delta = this.quill_data) => {
    let found = false
    _.each(delta.ops, op => {
      // could include commentHighlight === false
      if (op.attributes && _.keys(op.attributes, 'commentHighlight')) {
        found = true
      }
    })
    return found
  }
}

Item.defaults = {
  quill_data: { ops: [] },
  can_edit: false,
  thumbnail_url: '',
  version: 0,
}
Item.refDefaults = {
  roles: {
    model: Role,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Item
