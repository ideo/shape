import axios from 'axios'
import getVideoId from 'get-video-id'
import _ from 'lodash'

import v from '~/utils/variables'
import { parseUrl } from './url'

// e.g.
// https://ford.rev.vbrick.com/#/videos/08ebc122-eaa4-4ae4-839a-8497c044d409 (public)
// https://ford.rev.vbrick.com/#/videos/20706f6e-4ae0-4b2a-b715-1be405e0f280 (private)
const VBRICK_DOMAIN = 'ford.rev.vbrick.com'

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

    const data = this.getVideoId(url)
    const { service } = data
    const { id } = data
    retv.service = service
    retv.id = id
    retv.normalizedUrl = this.normalizedUrl(service, id)

    return retv
  }

  static getVideoId(url) {
    // wrapper for 'get-video-id' that includes Ford vbrick
    let { id, service } = getVideoId(url)
    if (url.match(new RegExp(VBRICK_DOMAIN, 'g'))) {
      service = 'vbrick'
      id = _.last(url.split('videos/'))
    } else if (service === 'vimeo' && !id) {
      const parsedUrl = parseUrl(url)
      if (parsedUrl.pathname.split('/').length > 2) {
        // the "id" in this case e.g. '123123/232323' is the pathname minus the first '/'
        id = parsedUrl.pathname.slice(1)
      }
    }
    return { id, service }
  }

  // Returns a URL that can be used throughout our system
  // to standardize video url format
  static normalizedUrl(service, id) {
    switch (service) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${id}`
      case 'vimeo':
        return `https://vimeo.com/${id}`
      case 'vbrick':
        // same note as above, have to check if this
        return `https://${VBRICK_DOMAIN}/#/videos/${id}`
      default:
        return null
    }
  }

  static privateVideoDefaults(id) {
    return {
      name: v.defaults.video.name,
      thumbnailUrl: v.defaults.video.thumbnailUrl,
      id,
    }
  }

  static getAPIdetails(url, password = '') {
    const { id, service } = this.getVideoId(url)
    if (!service || !id) return {}
    if (!this.isValid(url)) return {}

    switch (service) {
      case 'youtube':
        return this.getYoutubeDetails(id)
      case 'vimeo':
        return this.getVimeoDetails(id, password)
      case 'vbrick':
        return this.getVbrickDetails(id)
      default:
        return {}
    }
  }

  static async getYoutubeDetails(id) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${
      process.env.YOUTUBE_V3_API_KEY
    }`
    try {
      const response = await axios.get(apiUrl)
      const data = response.data.items[0].snippet
      const thumbs = data.thumbnails
      // https://developers.google.com/youtube/v3/docs/thumbnails
      // maxres = 1280w, standard = 640w, high = 480w, medium=320w
      const thumb =
        thumbs.maxres || thumbs.standard || thumbs.high || thumbs.medium
      return {
        name: data.title,
        // NOTE: Does "high" always exist? Do we have to check for sizes?
        thumbnailUrl: thumb.url,
      }
    } catch (e) {
      // there is no embedding of private youtube videos, so no point to allow it
      return {}
    }
  }

  static async getVimeoDetails(id, password = '') {
    if (id.indexOf('/') > 0) {
      return this.getVimeoPrivateDetails(id)
    }
    const apiUrl = `https://api.vimeo.com/videos/${id}`
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${process.env.VIMEO_V3_API_KEY}`,
        },
      }
      if (password) config.params = { password }
      const response = await axios.get(apiUrl, config)
      const { data } = response
      const thumbnail = _.find(
        _.reverse(data.pictures.sizes),
        i => i.width > 600
      )
      return {
        name: data.name,
        thumbnailUrl: thumbnail.link,
      }
    } catch (e) {
      const { response } = e
      let passwordRequired = false
      if (
        response &&
        response.data &&
        response.data.invalid_parameters &&
        response.data.invalid_parameters.length &&
        response.data.invalid_parameters[0].field === 'password'
      ) {
        passwordRequired = true
      }
      return {
        ...this.privateVideoDefaults(id),
        passwordRequired,
      }
    }
  }

  static async getVimeoPrivateDetails(id) {
    const apiUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`
    try {
      const { data } = await axios.get(apiUrl)
      return {
        name: data.title,
        thumbnailUrl: data.thumbnail_url,
      }
    } catch (e) {
      return this.privateVideoDefaults(id)
    }
  }

  static async getVbrickDetails(id) {
    const apiUrl = `https://${VBRICK_DOMAIN}/api/v1/videos/${id}/details`
    try {
      const response = await axios.get(apiUrl)
      const { data } = response
      if (data.id) {
        return {
          name: data.title,
          thumbnailUrl: data.thumbnailUrl,
        }
      }
      return {}
    } catch (e) {
      // could be a 404, or a 401...
      // until we have a vbrick login, hard to test how to respond to private/unauthorized
      return this.privateVideoDefaults(id)
    }
  }

  static isValid(url) {
    const { id, service } = this.getVideoId(url)
    if (!service || !id) return false
    switch (service) {
      case 'youtube':
        // ensure no extra characters between youtube[...].com
        return !/youtube(.+)\.com/.test(url)
      case 'vimeo':
        // ensure id is numeric (unless vimeo changes their format!)
        // ensure id is not identifying a group/id
        return /\d+/.test(id) && !/groups\/(\d+)$/.test(url)
      case 'vbrick':
        return true
      default:
        // unsupported service, e.g. Vine, Videopress
        return false
    }
  }
}

export default VideoUrl
