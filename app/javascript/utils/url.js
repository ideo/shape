
export function parseUrl(urlStr) {
  const url = document.createElement('a')
  url.href = urlStr
  return url
}

export default {
  parseUrl
}
