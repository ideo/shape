import IdeoSSO from 'ideo-sso-js-sdk'

window.CONFIG = window.CONFIG || {}

IdeoSSO.initFromEnv({
  IDEO_SSO_HOST: window.CONFIG.IDEO_SSO_HOST,
  IDEO_SSO_CLIENT_ID: window.CONFIG.IDEO_SSO_CLIENT_ID,
  BASE_HOST: window.CONFIG.BASE_HOST,
  IDEO_SSO_REDIRECT_PATH: window.CONFIG.IDEO_SSO_REDIRECT_PATH,
})
export default IdeoSSO
