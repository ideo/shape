
export default function initDoorbell(userId) {
  window.doorbellOptions = {
    id: '8217',
    hideEmail: true,
    email: "shape@shape.space",
    appKey: '75KY8PBQn3cLjrSzSGCGJ4HsSj6zgDQ5Sys0IHLxAF2vDCYgb5350FMRF4bJT89c',
    properties: {
      userId
    }
  }

  function l(w, d, t) { window.doorbellOptions.windowLoaded = true; var g = d.createElement(t);g.id = 'doorbellScript';g.type = 'text/javascript';g.async = true;g.src = 'https://embed.doorbell.io/button/'+window.doorbellOptions['id']+'?t='+(new Date().getTime());(d.getElementsByTagName('head')[0]||d.getElementsByTagName('body')[0]).appendChild(g); }
  l(window, document, 'script')
}
