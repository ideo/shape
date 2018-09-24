/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import TestSurveyPage from '~/ui/pages/TestSurveyPage'
import { Provider } from 'mobx-react'
import stores from '~/stores'

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
