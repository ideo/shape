const urlScheme = () => {
  return process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
}

const baseDomain = () => {
  return process.env.NODE_ENV === 'development'
    ? 'localhost:3000'
    : 'creativedifference.ideo.com'
}

const apiUrl = string => {
  return urlScheme() + baseDomain() + string
}

export default apiUrl
