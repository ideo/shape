import IdeoSSO from '~/utils/IdeoSSO'

function init() {
  // these params get created via Rails + ERB
  if (!window.IDEO_SSO_PARAMS) {
    return
  }
  const {
    action,
    email,
    token,
    logoutRequired,
    redirect,
    loginUrl,
  } = window.IDEO_SSO_PARAMS

  let confirmationRedirectUri = loginUrl
  if (redirect) {
    // append the redirect to the original oauth redirect path
    confirmationRedirectUri += `?redirect=${redirect}`
  }

  if (action === 'signIn') {
    IdeoSSO.signIn({ email, confirmationRedirectUri })
    return
  }
  if (action === 'signUp') {
    const signUp = () => {
      IdeoSSO.signUp({ email, token, confirmationRedirectUri })
    }

    if (logoutRequired) {
      IdeoSSO.logout('/login').then(signUp)
    } else {
      signUp()
    }
  }
}

init()
