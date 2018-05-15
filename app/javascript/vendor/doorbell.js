export default function initDoorbell(user) {
  if (!process.env.DOORBELL_API_KEY) return
  window.doorbellOptions = {
    id: process.env.DOORBELL_ACCOUNT_ID,
    hideEmail: true,
    email: user.email,
    appKey: process.env.DOORBELL_API_KEY,
    properties: {
      userId: user.id
    }
  }

  // eslint-disable-next-line
  function l(w, d, t) { window.doorbellOptions.windowLoaded = true; var g = d.createElement(t);g.id = 'doorbellScript';g.type = 'text/javascript';g.async = true;g.src = 'https://embed.doorbell.io/button/'+window.doorbellOptions['id']+'?t='+(new Date().getTime());(d.getElementsByTagName('head')[0]||d.getElementsByTagName('body')[0]).appendChild(g); }
  l(window, document, 'script')
}
