import axios from 'axios'
import getVideoId from 'get-video-id'
import _ from 'lodash'

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

  static getAPIdetails(url) {
    const { id, service } = getVideoId(url)
    if (!service || !id) return {}
    if (!this.isValid(url)) return {}

    if (service === 'youtube') {
      return this.getYoutubeDetails(id)
    } else if (service === 'vimeo') {
      return this.getVimeoDetails(id)
    }
    return {}
  }

  static async getYoutubeDetails(id) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YOUTUBE_V3_API_KEY}`
    try {
      const response = await axios.get(apiUrl)
      const data = response.data.items[0].snippet
      return {
        name: data.title,
        // "high" = 480x360
        // NOTE: Does "high" always exist? Do we have to check for sizes?
        thumbnail_url: data.thumbnails.high.url,
      }
    } catch (e) {
      return {}
    }
  }

  static async getVimeoDetails(id) {
    const apiUrl = `https://api.vimeo.com/videos/${id}`
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${process.env.VIMEO_V3_API_KEY}`
        }
      }
      const response = await axios.get(apiUrl, config)
      const { data } = response
      const thumbnail = _.find(data.pictures.sizes, i => i.width > 600)
      return {
        name: data.name,
        thumbnail_url: thumbnail.link,
      }
    } catch (e) {
      return {}
    }
  }

  static isValid(url) {
    const { id, service } = getVideoId(url)

    if (!service || !id) return false
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
}

export default VideoUrl
