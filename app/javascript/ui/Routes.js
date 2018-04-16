import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Router, Switch, Route } from 'react-router-dom'
import styled from 'styled-components'

import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import SearchPage from '~/ui/pages/SearchPage'
import TermsOfUseModal from '~/ui/users/TermsOfUseModal'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import Loader from '~/ui/layout/Loader'
import WindowSizeListener from 'react-window-size-listener'

const AppWrapper = styled.div`
  /* used by terms of use modal to blur the whole site */
  ${props => props.blur && `
    filter: blur(10px);
  `}
`
AppWrapper.displayName = 'AppWrapper'

@inject('apiStore', 'uiStore')
@observer
class Routes extends React.Component {
  componentDidMount() {
    const { apiStore, uiStore } = this.props
    apiStore.request('users/me')
      .then(({ data }) => {
        const user = data
        apiStore.setCurrentUserId(user.id)
        if (!user.terms_accepted) uiStore.update('blurContent', true)
      })
      // .catch(err => console.warn(new Error(err)))
  }

  handleWindowResize = ({ windowWidth }) => {
    // NOTE: Routes should only interact with uiStore for global re-rendering changes like this
    this.props.uiStore.updateColumnsToFit(windowWidth)
  }

  render() {
    const { history, uiStore, apiStore } = this.props
    if (!apiStore.currentUser) {
      return <Loader />
    }

    return (
      <AppWrapper blur={uiStore.blurContent}>
        <WindowSizeListener onResize={this.handleWindowResize} />
        {!apiStore.currentUser.terms_accepted &&
          <TermsOfUseModal user={apiStore.currentUser} />
        }
        <OrganizationMenu
          organization={apiStore.currentUser.current_organization}
          userGroups={apiStore.currentUser.groups}
        />
        <DialogWrapper />
        <Router history={history}>
          <Switch>
            <Route exact path="/" component={CollectionPage} />
            <Route path="/collections/:id" component={CollectionPage} />
            <Route path="/items/:id" component={ItemPage} />
            <Route path="/search" component={SearchPage} />
          </Switch>
        </Router>
      </AppWrapper>
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
