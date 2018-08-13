import axios from 'axios'
import { getMetadata } from 'page-metadata-parser'
import { parse } from 'url'

const parseURLMeta = async (urlStr) => {
  if (!urlStr) return false
  let url = urlStr
  let parsed = parse(url)
  // add scheme e.g. if someone typed "www.url.com"
  if (!parsed.protocol) url = `http://${url}`
  parsed = parse(url)

  const parser = new DOMParser()
  const proxy = process.env.CORS_PROXY_URL || 'https://cors-anywhere-cdolzdpypb.now.sh/'
  try {
    const response = await axios.get(`${proxy}${url}`)
    const doc = parser.parseFromString(response.data, 'text/html')
    const metadata = getMetadata(doc, url)
    return metadata
  } catch (e) {
    // will fail w/ 404 if link is invalid
    return false
  }
}

export default parseURLMeta
