export function parseUrl(urlStr) {
  const url = document.createElement('a')
  url.href = urlStr
  return url
}

export function stringifyUrlParams(obj) {
  return Object.keys(obj)
    .map(function(key) {
      return key + '=' + obj[key]
    })
    .join('&')
}

export function apiUrl(path) {
  return `api/v1/${path}`
}

export default {
  apiUrl,
  parseUrl,
}
