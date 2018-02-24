import getVideoId from 'get-video-id'

class VideoUrl {
  // Returns object with video { service, id, normalizedUrl }
  // Attrs are null if video URL is not valid
  // Currently supported services are Youtube and Vimeo
  static parse(url) {
    const retv = {
      service: null,
      id: null,
      normalizedUrl: null,
    }

    if (!this.isValid(url)) return retv

    const { id, service } = getVideoId(url)

    retv.service = service
    retv.id = id
    retv.normalizedUrl = this.normalizedUrl(service, id)

    return retv
  }

  // Returns a URL that can be used throughout our system
  // to standardize video url format
  static normalizedUrl(service, id) {
    switch (service) {
    case 'youtube':
      return `https://www.youtube.com/watch?v=${id}`
    case 'vimeo':
      return `https://vimeo.com/${id}`
    default:
      return null
    }
  }

  static isValid(url) {
    const { id, service } = getVideoId(url)

    if (service && id) {
      switch (service) {
      case 'youtube':
        // ensure no extra characters between youtube[...].com
        return !/youtube(.+)\.com/.test(url)
      case 'vimeo':
        // ensure id is numeric (unless vimeo changes their format!)
        // ensure id is not identifying a group/id
        return /\d+/.test(id) && !/groups\/(\d+)$/.test(url)
      default:
        return true
      }
    }
    return false
  }
}

export default VideoUrl
