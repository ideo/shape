/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import { syncHistoryWithStore } from 'mobx-react-router'
import { Router } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import { LocalizationProvider } from '@material-ui/pickers'
import MomentUtils from '@material-ui/pickers/adapter/moment'

import Routes from '~/ui/Routes'
import stores, { routingStore } from '~/stores'
import '~/vendor/cypress'

// Enable MobX Strict functionality -- requires explicit @actions
configure({ enforceActions: 'observed' })

const browserHistory = createBrowserHistory()
const history = syncHistoryWithStore(browserHistory, routingStore)

const RenderApp = inner => {
  ReactDOM.render(
    <Provider {...stores}>
      <LocalizationProvider dateAdapter={MomentUtils}>
        <Router history={history}>{inner}</Router>
      </LocalizationProvider>
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
