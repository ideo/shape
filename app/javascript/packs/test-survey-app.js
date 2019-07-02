/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import { configure } from 'mobx'
import TestSurveyPage from '~/ui/pages/TestSurveyPage'
import { Provider } from 'mobx-react'
import stores from '~/stores'

// Enable MobX Strict functionality -- requires explicit @actions
configure({ enforceActions: 'observed' })

if (module.hot) {
  module.hot.accept('../ui/pages/TestSurveyPage', () => {
    const HotApp = require('../ui/pages/TestSurveyPage').default
    ReactDOM.render(
      <Provider {...stores}>
        <HotApp />
      </Provider>,
      document.getElementById('react-root')
    )
  })
}

ReactDOM.render(
  <Provider {...stores}>
    <TestSurveyPage />
  </Provider>,
  document.getElementById('react-root')
)
