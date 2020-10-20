const urlScheme = () => {
  return process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
}

const baseDomain = () => {
  return process.env.NODE_ENV === 'development'
    ? 'localhost:3001'
    : 'shape.space'
}

const apiUrl = string => {
  return urlScheme() + baseDomain() + string
}

export default apiUrl
