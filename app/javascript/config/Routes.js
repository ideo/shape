import React from 'react'
import { Router, Switch, Route } from 'react-router-dom'

// import Layout from '~/ui/layouts/Layout'
import HomePage from '~/ui/pages/HomePage'
import CollectionPage from '~/ui/pages/CollectionPage'

const Routes = ({ history }) => (
  <Router history={history}>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/collections/:id" component={CollectionPage} />
    </Switch>
  </Router>
)

export default Routes
