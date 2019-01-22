// just a simple wrapper for GTM dataLayer

const googleTagManager = {
  push: params => {
    window.dataLayer = window.dataLayer || []
    return window.dataLayer.push(params)
  },
}

export default googleTagManager
