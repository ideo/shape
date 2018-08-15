/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { Router } from 'react-router-dom'

import MarketingRoutes from '~/ui/MarketingRoutes'

const browserHistory = createBrowserHistory()

if (module.hot) {
  module.hot.accept('../ui/MarketingRoutes', () => {
    const HotRoutes = require('../ui/MarketingRoutes').default
    ReactDOM.render(
      <Router history={browserHistory}>
        <HotRoutes />
      </Router>,
      document.getElementById('react-root')
    )
  })
}

ReactDOM.render(
  <Router history={browserHistory}>
    <MarketingRoutes />
  </Router>,
  document.getElementById('react-root')
)
