import filestack from 'filestack-js'

const API_KEY = process.env.FILESTACK_API_KEY

const imageUploadConfig = {
  accept: 'image/*',
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

  static async pickImage({ onSuccess, onFailure } = {}) {
    const resp = await this.client.pick(imageUploadConfig)
    if (resp.filesUploaded.length > 0) {
      const img = resp.filesUploaded[0]
      const fileAttrs = {
        handle: img.handle,
        filename: img.filename,
        size: img.size,
        mimetype: img.mimetype,
      }
      fileAttrs.url = this.transformedUrl(img.url)

      // Could re-upload the image at this point if we wanted to... for now we're
      // just saving the transform url e.g. https://process.filestackapi.com/resize...
      // const newResp = await this.client.storeURL(newUrl)
      // fileAttrs.url = newResp.url

      if (onSuccess) onSuccess(fileAttrs)
    } else if (onFailure) {
      onFailure(resp.filesFailed)
    }
    return resp
  }

  static transformedUrl(url) {
    return this.client.transform(url, {
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
