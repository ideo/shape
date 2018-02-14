import { inject, observer } from 'mobx-react'
import { Router, Switch, Route } from 'react-router-dom'

// import HomePage from '~/ui/pages/HomePage'
import CollectionPage from '~/ui/pages/CollectionPage'

@inject('apiStore')
@observer
class Routes extends React.Component {
  componentDidMount() {
    const { apiStore } = this.props
    apiStore.request('/users/me')
      .then(response => {
        apiStore.sync(response)
        apiStore.setCurrentUserId(response.data.id)
      })
  }

  render() {
    const { history, apiStore } = this.props
    if (!apiStore.currentUser) {
      return 'Loading...'
    }
    return (
      <Router history={history}>
        <Switch>
          <Route exact path="/" component={CollectionPage} />
          <Route path="/collections/:id" component={CollectionPage} />
        </Switch>
      </Router>
    )
  }
}

export default Routes
