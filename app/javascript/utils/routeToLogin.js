const routeToLogin = ({ redirect = null } = {}) => {
  let path = '/login'
  if (redirect) {
    path += `?redirect=${encodeURI(redirect)}`
  }
  window.location.href = path
}

export default routeToLogin
