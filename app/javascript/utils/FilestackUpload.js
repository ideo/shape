import filestack from 'filestack-js'

const API_KEY = 'AhSviFaSOQwS4o2dzycl0z'

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
