import filestack from 'filestack-js'

const API_KEY = process.env.FILESTACK_API_KEY

const imageUploadConfig = {
  accept: 'image/*',
  maxFiles: 1,
  transformations: {
    crop: {
      aspectRatio: 16 / 9
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

  static pickImage() {
    return this.client.pick(imageUploadConfig)
  }

  static makeDropPane(opts = {}) {
    const config = Object.assign({}, dropPaneDefaults, opts)
    return this.client.makeDropPane(config)
  }
}

export default FilestackUpload
