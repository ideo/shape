import axios from 'axios'
import filestack from 'filestack-js'

const API_KEY = process.env.FILESTACK_API_KEY

const imageUploadConfig = {
  accept: [
    'image/*',
    'application/pdf',
  ],
  maxFiles: 1,
  imageMax: [1200, 1200],
  transformations: {
    crop: {
      aspectRatio: 5 / 4
    }
  }
}

const dropPaneDefaults = {
  overlay: false,
  showIcon: false,
  customText: ' ',
}

class FilestackUpload {
  static get client() {
    return filestack.init(API_KEY)
  }

  static async processFile(filesUploaded) {
    const file = filesUploaded[0]
    const fileAttrs = {
      handle: file.handle,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: file.url,
      docInfo: null,
    }
    if (file.mimetype !== 'application/pdf') {
      fileAttrs.url = this.transformedImageUrl(file.handle)
    } else {
      const docinfoUrl = this.client.transform(file.handle, {
        output: { docinfo: true },
      })
      const docResp = await axios.get(docinfoUrl)
      fileAttrs.docinfo = docResp.data
    }
    return fileAttrs
  }

  static async pickImage({ onSuccess, onFailure } = {}) {
    const resp = await this.client.pick(imageUploadConfig)
    if (resp.filesUploaded.length > 0) {
      const fileAttrs = await this.processFile(resp.filesUploaded)
      if (onSuccess) onSuccess(fileAttrs)
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

  static transformedImageUrl(handle) {
    return this.client.transform(handle, {
      resize: { fit: 'max', width: 1200 },
      rotate: { deg: 'exif' },
    })
  }

  static makeDropPane(opts = {}) {
    const config = Object.assign({}, dropPaneDefaults, opts)
    return this.client.makeDropPane(config)
  }
}

export default FilestackUpload
