import IdeoSSO from 'ideo-sso-js-sdk'

IdeoSSO.initFromEnv({
  IDEO_SSO_HOST: process.env.IDEO_SSO_HOST,
  IDEO_SSO_CLIENT_ID: process.env.IDEO_SSO_CLIENT_ID,
  BASE_HOST: process.env.BASE_HOST,
  IDEO_SSO_REDIRECT_PATH: process.env.IDEO_SSO_REDIRECT_PATH,
})
export default IdeoSSO
