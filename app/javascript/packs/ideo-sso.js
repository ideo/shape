import IdeoSSO from 'ideo-sso-js-sdk'

// add this to the global context because (for legacy reasons) that's how other files are referencing it
window.IdeoSSO = IdeoSSO
IdeoSSO.init(window.ideo_sso_init_params || {})
