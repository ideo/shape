import queryString from 'query-string'

// checks if key and value exists within param string
const hasKeyValueParam = (paramString, key, value) => {
  if (!paramString) {
    return false
  }
  const params = queryString.parse(paramString)
  if (!params) {
    return false
  }
  if (params[key] !== value) {
    return false
  }
  return true
}

export { hasKeyValueParam }
