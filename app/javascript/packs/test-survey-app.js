/* eslint global-require: 0 */
import ReactDOM from 'react-dom'
import TestSurvey from '~/ui/test_collections/TestSurvey'

if (module.hot) {
  module.hot.accept('../ui/test_collections/TestSurvey', () => {
    const HotApp = require('../ui/test_collections/TestSurvey').default
    ReactDOM.render(
      <HotApp />,
      document.getElementById('react-root')
    )
  })
}

ReactDOM.render(
  <TestSurvey />,
  document.getElementById('react-root')
)
