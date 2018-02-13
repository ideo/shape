/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import { syncHistoryWithStore } from 'mobx-react-router'
import { MobxIntlProvider } from 'mobx-react-intl'

import Routes from '~/ui/Routes'
import stores, { routingStore } from '~/stores'

// TODO: refactor?
import '~/styles/grid_tmp.scss'

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
          <HotRoutes history={history} />
        </MobxIntlProvider>
      </Provider>,
      document.getElementById('react-root')
    )
  })
}

ReactDOM.render(
  <Provider {...stores}>
    <MobxIntlProvider>
      <Routes history={history} />
    </MobxIntlProvider>
  </Provider>,
  document.getElementById('react-root')
)
