import axios from 'axios'
import filestack from 'filestack-js'

import { apiStore } from '~/stores'

const API_KEY = process.env.FILESTACK_API_KEY

export const MAX_SIZE = 25 * 1024 * 1024

const imageUploadConfig = {
  accept: ['.pdf', 'image/*', 'application/*', 'text/*', '.docx', '.ppt'],
  maxFiles: 1,
  imageMax: [7500, 7500],
  maxSize: MAX_SIZE,
  transformations: {
    crop: {
      aspectRatio: 5 / 4,
    },
  },
}

const multiImageUploadConfig = {
  ...imageUploadConfig,
  maxFiles: 20,
}

const dropPaneDefaults = {
  overlay: false,
  showIcon: false,
  customText: ' ',
}

class FilestackUpload {
  static get client() {
    return filestack.init(API_KEY, apiStore.filestackToken)
  }

  static async processFiles(filesUploaded) {
    const filesAttrs = filesUploaded.map(async file => {
      const fileAttrs = {
        handle: file.handle,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: file.url,
        docInfo: null,
      }
      if (file.mimetype === 'application/pdf') {
        const docinfoUrl = this.client.transform(file.handle, {
          output: { docinfo: true },
        })
        const docResp = await axios.get(docinfoUrl)
        fileAttrs.docinfo = docResp.data
      }
      return fileAttrs
    })

    return Promise.all(filesAttrs)
  }

  static async pickImage(opts = {}) {
    return FilestackUpload.pickOneOrMore({ multiple: false, ...opts })
  }

  static async pickImages(opts = {}) {
    return FilestackUpload.pickOneOrMore({ multiple: true, ...opts })
  }

  static async pickOneOrMore({ onSuccess, onFailure, multiple } = {}) {
    const config = multiple ? multiImageUploadConfig : imageUploadConfig
    const resp = await this.client.pick(config)
    if (resp.filesUploaded.length > 0) {
      const filesAttrs = await this.processFiles(resp.filesUploaded)
      if (onSuccess) onSuccess(multiple ? filesAttrs : filesAttrs[0])
    } else if (onFailure) {
      onFailure(resp.filesFailed)
    }
    return resp
  }

  static pdfCoverUrl(handle) {
    return this.client.transform(handle, {
      output: { format: 'png' },
      resize: { fit: 'max', width: 400 },
    })
  }

  static imageUrl({ handle = '', mimetype = '', filestackOpts = {} } = {}) {
    const params = {
      rotate: { deg: 'exif' },
      ...filestackOpts,
    }
    if (mimetype.indexOf('svg') > -1) {
      // svg doesn't allow these transforms
      delete params.rotate
      delete params.resize
    }
    return this.client.transform(handle, params)
  }

  static preview(handle, id) {
    return this.client.preview(handle, { id })
  }

  static makeDropPane(opts = {}, uploadOpts = {}) {
    const config = Object.assign({}, dropPaneDefaults, opts)
    const uploadConfig = Object.assign({}, multiImageUploadConfig, uploadOpts)
    return this.client.makeDropPane(config, uploadConfig)
  }

  static filestackFileAttrs(file) {
    return {
      url: file.url,
      handle: file.handle,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      docinfo: file.docinfo,
    }
  }
}

export default FilestackUpload
