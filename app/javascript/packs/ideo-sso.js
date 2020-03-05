import IdeoSSO from '~/utils/IdeoSSO'

function init() {
  // these params get created via Rails + ERB
  if (!window.IDEO_SSO_PARAMS) {
    return
  }
  const { action, email, token, logoutRequired } = window.IDEO_SSO_PARAMS

  if (action === 'signIn') {
    IdeoSSO.signIn({ email })
    return
  }
  if (action === 'signUp') {
    const signUp = () => {
      IdeoSSO.signUp({ email, token })
    }

    if (logoutRequired) {
      IdeoSSO.logout('/login').then(signUp)
    } else {
      signUp()
    }
  }
}

init()
