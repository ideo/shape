/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import { syncHistoryWithStore } from 'mobx-react-router'
import { Router } from 'react-router-dom'

import AdminRoutes from '~/ui/AdminRoutes'
import stores, { routingStore } from '~/stores'
import '~/vendor/cypress'

// Enable MobX Strict functionality -- requires explicit @actions
configure({ enforceActions: 'observed' })

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

if (module.hot) {
  module.hot.accept('../ui/Routes', () => {
    const HotRoutes = require('../ui/AdminRoutes').default
    RenderApp(<HotRoutes />)
  })
}

RenderApp(<AdminRoutes />)
