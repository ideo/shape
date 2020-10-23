import _ from 'lodash'
import * as Sentry from '@sentry/browser'

export default function trackError(err, opts = {}) {
  // 401/404 not really an "error" don't need to alert appsignal
  if (err && _.includes([401, 404], err.status)) {
    return
  }
  // if (process.env.NODE_ENV === 'development') {
  console.error(err) // eslint-disable-line no-console
  // }
  trackErrorSpecify(
    opts.source || 'Any',
    opts.message || err.message,
    opts.name || err.name,
    _.isString(err.stack) ? err.stack.split('\n') : ''
  )
  if (process.env.SENTRY_DSN) {
    Sentry.withScope(scope => {
      if (opts.message) scope.setExtra('extraMessage', opts.message)
      if (opts.source) scope.setExtra('extraSource', opts.source)
      Sentry.captureException(err)
    })
  }
}

// So it's available in the network components
window.trackError = trackError

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
    },
  }
  console.warn('error tr', data) // eslint-disable-line no-console
  if (!process.env.APPSIGNAL_PUSH_API_KEY) return
  const xhr = new window.XMLHttpRequest()
  xhr.open('POST', '/appsignal_error_catcher', true)
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  xhr.send(JSON.stringify(data))
}
