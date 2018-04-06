import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Router, Switch, Route } from 'react-router-dom'

import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
import AlertDialog from '~/ui/global/modals/AlertDialog'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import SearchPage from '~/ui/pages/SearchPage'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import Loader from '~/ui/layout/Loader'
import WindowSizeListener from 'react-window-size-listener'

@inject('apiStore', 'uiStore')
@observer
class Routes extends React.Component {
  componentDidMount() {
    const { apiStore } = this.props
    apiStore.request('users/me')
      .then(response => {
        apiStore.setCurrentUserId(response.data.id)
      })
      // .catch(err => console.warn(new Error(err)))
  }

  handleWindowResize = ({ windowWidth }) => {
    this.props.uiStore.updateColumnsToFit(windowWidth)
  }

  render() {
    const { history, apiStore, uiStore } = this.props
    if (!apiStore.currentUser) {
      return <Loader />
    }
    return (
      <Fragment>
        <WindowSizeListener onResize={this.handleWindowResize} />
        <OrganizationMenu
          organization={apiStore.currentUser.current_organization}
          userGroups={apiStore.currentUser.groups}
        />
        <ConfirmationDialog {...uiStore.dialogConfig} />
        <AlertDialog {...uiStore.dialogConfig} />
        <Router history={history}>
          <Switch>
            <Route exact path="/" component={CollectionPage} />
            <Route path="/collections/:id" component={CollectionPage} />
            <Route path="/items/:id" component={ItemPage} />
            <Route path="/search" component={SearchPage} />
          </Switch>
        </Router>
      </Fragment>
    )
  }
}

Routes.propTypes = {
  history: ReactRouterPropTypes.history.isRequired,
}
Routes.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Routes
