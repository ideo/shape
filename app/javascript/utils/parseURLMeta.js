import axios from 'axios'
import metaDataParser from '~/vendor/page-metadata-parser'
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
  const shapeLink =
    hostname.match(/shape\.space/i) ||
    (process.env.SHAPE_APP === 'localhost' && hostname.match(/localhost/i))
  if (shapeLink) {
    const itemOrCollection = pathname.match(/\/(collections|items)\/(\d+)/)
    if (itemOrCollection) {
      return {
        shapeLink: true,
        recordType: itemOrCollection[1].slice(0, -1), // cut off the 's'
        recordId: itemOrCollection[2],
      }
    } else if (pathname.length > 1) {
      // always just return the url for an internal Shape link
      // even if not an item/collection (e.g. /tests/xyz)
      return {
        url,
        icon:
          'https://dgqn8hswhczqn.cloudfront.net/assets/favicons/apple-touch-icon-4c8dfc8a98d38e7c012c7d80528e0cf6f06e687794931cb389c7c9f919497744.png',
      }
    }
  }

  const parser = new DOMParser()
  const proxy = '/passthru'
  try {
    const response = await axios.get(proxy, { params: { url } })
    const doc = parser.parseFromString(response.data, 'text/html')
    const metadata = metaDataParser.getMetadata(doc, url)
    return metadata
  } catch (e) {
    // will catch a 404 if link is invalid.
    // we still return a metadata object ensuring "http" prefixed URL
    return { url }
  }
}

export default parseURLMeta
