import filestack from 'filestack-js'

const API_KEY = process.env.FILESTACK_API_KEY

const imageUploadConfig = {
  accept: 'image/*',
  maxFiles: 1,
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

  static async pickImage({ onSuccess, onFailure } = {}) {
    const resp = await this.client.pick(imageUploadConfig)
    if (resp.filesUploaded.length > 0) {
      const img = resp.filesUploaded[0]
      const fileAttrs = {
        url: img.url,
        handle: img.handle,
        filename: img.filename,
        size: img.size,
        mimetype: img.mimetype,
      }
      if (onSuccess) onSuccess(fileAttrs)
    } else {
      if (onFailure) onFailure(resp.filesFailed)
    }
    return resp
  }

  static makeDropPane(opts = {}) {
    const config = Object.assign({}, dropPaneDefaults, opts)
    return this.client.makeDropPane(config)
  }
}

export default FilestackUpload
