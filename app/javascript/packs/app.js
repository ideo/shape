/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import { syncHistoryWithStore } from 'mobx-react-router'
import { Router } from 'react-router-dom'
import * as Sentry from '@sentry/browser'

import Routes from '~/ui/Routes'
import stores, { routingStore } from '~/stores'
import '~/vendor/cypress'

// Enable MobX Strict functionality -- requires explicit @actions
// TODO: re-enable before releasing to production
// Fork this PR: https://github.com/masylum/mobx-rest/pull/80/files
// configure({ enforceActions: 'observed' })

const browserHistory = createBrowserHistory()
const history = syncHistoryWithStore(browserHistory, routingStore)

const RenderApp = inner => {
  ReactDOM.render(
    <Provider {...stores}>
      <Router history={history}>{inner}</Router>
    </Provider>,
    document.getElementById('react-root')
  )
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SHAPE_APP,
    release: process.env.SOURCE_VERSION,
  })
}

if (module.hot) {
  module.hot.accept('../ui/Routes', () => {
    const HotRoutes = require('../ui/Routes').default
    RenderApp(<HotRoutes />)
  })
}

RenderApp(<Routes />)
