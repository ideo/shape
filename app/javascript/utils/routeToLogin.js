export const loginRedirectPath = (redirect = null) => {
  let path = '/login'
  if (redirect) {
    path += `?redirect=${encodeURI(redirect)}`
  }
  return path
}

export const routeToLogin = ({ redirect = null } = {}) => {
  window.location.href = loginRedirectPath(redirect)
}

export default routeToLogin
