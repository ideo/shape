import React from 'react'
import { Router, Switch, Route } from 'react-router-dom'

// import Layout from '~/ui/layouts/Layout'
import HomePage from '~/app/pages/HomePage'
import CollectionPage from '~/app/pages/CollectionPage'

const Routes = ({ history }) => (
  <Router history={history}>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/collections/:slug" component={CollectionPage} />
    </Switch>
  </Router>
)

export default Routes
