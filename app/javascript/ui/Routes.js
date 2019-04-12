import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import { MuiThemeProvider } from '@material-ui/core/styles'
import WindowSizeListener from 'react-window-size-listener'
import styled from 'styled-components'

import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import ErrorBoundary from '~/ui/global/ErrorBoundary'
import ZendeskWidget from '~/ui/global/ZendeskWidget'
import Header from '~/ui/layout/Header'
import HomePage from '~/ui/pages/HomePage'
import {
  CollectionApiWrapper,
  MyCollectionApiWrapper,
  ItemApiWrapper,
} from '~/ui/pages/PageWithApiWrapper'
import Loader from '~/ui/layout/Loader'
import SearchPage from '~/ui/pages/SearchPage'
import SettingsPage from '~/ui/pages/SettingsPage'
import TermsPage from '~/ui/pages/TermsPage'
import BillingPage from '~/ui/pages/BillingPage'
import BillingStatement from '~/ui/pages/BillingStatement'
import TermsOfUseModal from '~/ui/users/TermsOfUseModal'
import OrganizationSettings from '~/ui/organizations/OrganizationSettings'
import UserSettings from '~/ui/users/UserSettings'
import v from '~/utils/variables'
import firebaseClient from '~/vendor/firestore'
import MuiTheme, { BillingMuiTheme } from '~/ui/theme'
import captureGlobalKeypress from '~/utils/captureGlobalKeypress'

const AppWrapper = styled.div`
  /* used by terms of use modal to blur the whole site */
  ${props =>
    props.blur &&
    `
    filter: blur(10px);
  `};
`
AppWrapper.displayName = 'AppWrapper'

const FixedBoundary = styled.div`
  position: fixed;
  top: 0;
  height: 100vh;
  width: 100vw;
`
const FixedActivityLogWrapper = styled.div`
  position: fixed;
  top: 0;
  z-index: ${v.zIndex.activityLog};
`

// withRouter allows it to respond automatically to routing changes in props
@withRouter
@inject('apiStore', 'uiStore', 'routingStore')
@observer
class Routes extends React.Component {
  componentDidMount() {
    const { apiStore } = this.props
    apiStore.loadCurrentUser().then(() => {
      firebaseClient.authenticate(apiStore.currentUser.google_auth_token)
    })
    document.addEventListener('keydown', captureGlobalKeypress)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', captureGlobalKeypress)
  }

  handleWindowResize = ({ windowWidth }) => {
    // NOTE: Routes should only interact with uiStore for global re-rendering changes like this
    const { uiStore } = this.props
    uiStore.updateColumnsToFit(windowWidth)
    uiStore.updateActivityLogWidth(windowWidth)
    uiStore.update('windowWidth', windowWidth)
  }

  handleClick = e => {
    const { target } = e
    const { uiStore } = this.props

    if (!target.getAttribute) return

    if (target.getAttribute('data-deselect-on-click')) uiStore.deselectCards()
  }

  render() {
    const { apiStore, routingStore } = this.props
    if (!apiStore.currentUser) {
      return <Loader />
    }
    const displayTermsPopup =
      !apiStore.currentUser.terms_accepted &&
      !routingStore.pathContains('/terms')

    return (
      <AppWrapper
        onClick={this.handleClick}
        blur={displayTermsPopup}
        id="AppWrapper"
      >
        <ErrorBoundary>
          <MuiThemeProvider theme={MuiTheme}>
            {/* Global components are rendered here */}
            <WindowSizeListener onResize={this.handleWindowResize} />
            <DialogWrapper />
            <ZendeskWidget />

            <Header />
            <FixedBoundary className="fixed_boundary" data-deselect-on-click />
            <FixedActivityLogWrapper>
              <ActivityLogBox />
            </FixedActivityLogWrapper>
            {displayTermsPopup && (
              <TermsOfUseModal currentUser={apiStore.currentUser} />
            )}
            {/* Switch will stop when it finds the first matching path */}
            <Switch>
              <Route
                exact
                path="/"
                render={() =>
                  apiStore.currentOrgSlug ? (
                    <Redirect to={`/${apiStore.currentOrgSlug}`} />
                  ) : (
                    <HomePage />
                  )
                }
              />
              {/* These routes are doubled up so that the non-org route
                will route you to the org one */}
              <Route path="/collections/:id" component={CollectionApiWrapper} />
              <Route
                path="/:org/collections/:id"
                component={CollectionApiWrapper}
              />
              <Route path="/items/:id" component={ItemApiWrapper} />
              <Route path="/:org/items/:id" component={ItemApiWrapper} />
              <Route path="/search" component={SearchPage} />
              <Route path="/:org/search" component={SearchPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/terms/:org" component={TermsPage} />

              <Route
                path="/billing"
                render={() => (
                  // There must be a better way to apply BillingMuiTheme to all billing pages,
                  // however sticking MuiThemeProvider within the <Switch> made it angry
                  <MuiThemeProvider theme={BillingMuiTheme}>
                    <BillingPage />
                  </MuiThemeProvider>
                )}
              />
              <Route
                path="/print/invoices/:id"
                render={props => (
                  <MuiThemeProvider theme={BillingMuiTheme}>
                    <BillingStatement {...props} />
                  </MuiThemeProvider>
                )}
              />
              <Route
                path="/settings"
                render={() => (
                  <SettingsPage>
                    <OrganizationSettings />
                  </SettingsPage>
                )}
              />
              <Route
                path="/user_settings"
                render={() => (
                  <SettingsPage>
                    <UserSettings />
                  </SettingsPage>
                )}
              />
              {/* catch routes that we don't understand */}
              {/* TODO: refactor PageError to be a more standalone 404 page */}
              <Route
                exact
                path="/:org/:not_found"
                render={() => <Redirect to="/" />}
              />
              {/* have to put this last to catch all org slugs */}
              <Route
                exact
                path="/:org"
                render={props => <MyCollectionApiWrapper {...props} />}
              />
            </Switch>
          </MuiThemeProvider>
        </ErrorBoundary>
      </AppWrapper>
    )
  }
}

Routes.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Routes
