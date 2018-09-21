import axios from 'axios'
import metaDataParser from 'page-metadata-parser'
import { parse } from 'url'

const parseURLMeta = async urlStr => {
  if (!urlStr) return false
  let url = urlStr
  let parsed = parse(url)
  // add scheme e.g. if someone typed "www.url.com"
  if (!parsed.protocol) url = `http://${url}`
  parsed = parse(url)
  if (!parsed || typeof parsed !== 'object') return false

  const { hostname, pathname } = parsed
  if (
    hostname.match(/shape\.space/i) ||
    (process.env.SHAPE_APP === 'localhost' && hostname.match(/localhost/i))
  ) {
    const match = pathname.match(/\/(collections|items)\/(\d+)/)
    if (match) {
      return {
        shapeLink: true,
        recordType: match[1].slice(0, -1), // cut off the 's'
        recordId: match[2],
      }
    }
  }

  const parser = new DOMParser()
  const proxy = '/passthru?url='
  try {
    const response = await axios.get(`${proxy}${url}`)
    const doc = parser.parseFromString(response.data, 'text/html')
    const metadata = metaDataParser.getMetadata(doc, url)
    return metadata
  } catch (e) {
    // will fail w/ 404 if link is invalid
    return false
  }
}

export default parseURLMeta
