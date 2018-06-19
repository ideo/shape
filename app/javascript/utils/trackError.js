
export default function trackError(source, message, name, backtrace) {
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
  console.log('error tr', data)
  const xhr = new window.XMLHttpRequest()
  xhr.open('POST', '/appsignal_error_catcher', true)
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  xhr.send(JSON.stringify(data))
}
