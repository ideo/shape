/* eslint global-require: 0 */
import React from 'react'
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import { syncHistoryWithStore } from 'mobx-react-router'

import Routes from '~/config/Routes'
import stores, { routingStore } from '~/stores/index'

// Enable MobX Strict functionality -- requires explicit @actions
useStrict(true)

const browserHistory = createBrowserHistory()

const history = syncHistoryWithStore(browserHistory, routingStore)

if (module.hot) {
  module.hot.accept('../config/Routes', () => {
    const HotRoutes = require('../config/Routes').default
    ReactDOM.render(
      <Provider {...stores}>
        <HotRoutes history={history} />
      </Provider>,
      document.getElementById('react-root')
    )
  })
}

ReactDOM.render(
  <Provider {...stores}>
    <Routes history={history} />
  </Provider>,
  document.getElementById('react-root')
)
