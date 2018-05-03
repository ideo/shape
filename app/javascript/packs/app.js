/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import { syncHistoryWithStore } from 'mobx-react-router'
import { MobxIntlProvider } from 'mobx-react-intl'
import { Router } from 'react-router-dom'

import Routes from '~/ui/Routes'
import stores, { routingStore } from '~/stores'

// Enable MobX Strict functionality -- requires explicit @actions
useStrict(true)

const browserHistory = createBrowserHistory()
const history = syncHistoryWithStore(browserHistory, routingStore)

if (module.hot) {
  module.hot.accept('../ui/Routes', () => {
    const HotRoutes = require('../ui/Routes').default
    ReactDOM.render(
      <Provider {...stores}>
        <MobxIntlProvider>
          <Router history={history} >
            <HotRoutes />
          </Router>
        </MobxIntlProvider>
      </Provider>,
      document.getElementById('react-root')
    )
  })
}

ReactDOM.render(
  <Provider {...stores}>
    <MobxIntlProvider>
      <Router history={history} >
        <Routes />
      </Router>
    </MobxIntlProvider>
  </Provider>,
  document.getElementById('react-root')
)
