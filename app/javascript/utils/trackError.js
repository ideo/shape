export default function trackError(err, opts = {}) {
  trackErrorSpecify(
    opts.source || 'Any',
    opts.message || err.message,
    opts.name || err.name,
    err.stack.split('\n')
  )
}

export function trackErrorSpecify(source, message, name, backtrace) {
  const data = {
    action: source,
    message,
    name,
    backtrace,
    path: window.location.pathname,
    environment: {
      agent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
    }
  }
  console.warn('error tr', data)
  if (!process.env.APPSIGNAL_PUSH_API_KEY) return
  const xhr = new window.XMLHttpRequest()
  xhr.open('POST', '/appsignal_error_catcher', true)
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  xhr.send(JSON.stringify(data))
}
