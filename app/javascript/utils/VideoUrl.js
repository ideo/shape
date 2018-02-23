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

    const { id, service } = getVideoId(url)

    // If not valid, return
    if (!id || !service) return retv

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
    const { service, id } = this.parse(url)
    return (service && id)
  }
}

export default VideoUrl
