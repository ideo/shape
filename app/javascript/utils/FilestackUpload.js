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

class FilestackUpload {
  static client() {
    return filestack.init(API_KEY)
  }

  static pickImage() {
    return this.client().pick(imageUploadConfig)
  }
}

export default FilestackUpload
