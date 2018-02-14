import { inject, observer } from 'mobx-react'
import { Router, Switch, Route } from 'react-router-dom'
import to from 'await-to-js'

// import Layout from '~/ui/layouts/Layout'
import HomePage from '~/ui/pages/HomePage'
import CollectionPage from '~/ui/pages/CollectionPage'

@inject('apiStore')
@observer
class Routes extends React.Component {
  async componentWillMount() {
    const { apiStore } = this.props
    const [err, response] = await to(apiStore.request('/users/me'))
    if (response) {
      apiStore.sync(response)
      apiStore.setCurrentUserId(response.data.id)
    } else if (err) {
      console.warn('login error!', err)
    }
  }

  render() {
    const { history, apiStore } = this.props
    if (!apiStore.currentUser) {
      return 'O no, there was an error.'
    }
    return (
      <Router history={history}>
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/collections/:id" component={CollectionPage} />
        </Switch>
      </Router>
    )
  }
}

export default Routes
