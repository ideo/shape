import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import WindowSizeListener from 'react-window-size-listener'
import styled from 'styled-components'

import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'
import CollectionPage from '~/ui/pages/CollectionPage'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import ErrorBoundary from '~/ui/global/ErrorBoundary'
import Header from '~/ui/layout/Header'
import ItemPage from '~/ui/pages/ItemPage'
import Loader from '~/ui/layout/Loader'
import MarketingPage from '~/ui/pages/MarketingPage'
import SearchPage from '~/ui/pages/SearchPage'
import SettingsPage from '~/ui/pages/SettingsPage'
import TermsPage from '~/ui/pages/TermsPage'
import TermsOfUseModal from '~/ui/users/TermsOfUseModal'
import initDoorbell from '~/vendor/doorbell'
import OrganizationSettings from '~/ui/organizations/OrganizationSettings'
import UserSettings from '~/ui/users/UserSettings'
import v from '~/utils/variables'
import firebaseClient from '~/vendor/firestore'

const AppWrapper = styled.div`
  /* used by terms of use modal to blur the whole site */
  ${props => props.blur && `
    filter: blur(10px);
  `}
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
  theme = createMuiTheme({
    typography: {
      // Use the Shape font instead of the default Roboto font.
      fontFamily: v.fonts.sans,
    },
  })

  componentWillMount() {
    this.handleAsAnonymousUser()
  }

  componentDidMount() {
    const { apiStore } = this.props
    const isAnonymous = this.state.isAnonymous

    if(!isAnonymous) {
      apiStore.loadCurrentUserAndGroups().then(() => {
        initDoorbell(apiStore.currentUser)
        firebaseClient.authenticate(apiStore.currentUser.google_auth_token)
      })
    } // Later, we're going to need to use firestore anonymous here for anonymous pages
  }

  handleWindowResize = ({ windowWidth }) => {
    // NOTE: Routes should only interact with uiStore for global re-rendering changes like this
    const { uiStore } = this.props
    uiStore.updateColumnsToFit(windowWidth)
    uiStore.updateActivityLogWidth(windowWidth)
    uiStore.update('windowWidth', windowWidth)
  }

  handleAsAnonymousUser(){
    const { apiStore, routingStore } = this.props
    // even if logged in, you're anonymous for marketing site
    if (routingStore.pathContains('/marketing')){
      this.setState({isAnonymous: true})
    } else {
      this.setState({isAnonymous: false})
    }
  }

  render() {
    const { apiStore, routingStore } = this.props

    const isAnonymous = this.state.isAnonymous
    
    if (!isAnonymous && !apiStore.currentUser) {
      return <Loader />
    }

    const displayTermsPopup = (
      !isAnonymous && (
        !apiStore.currentUser.terms_accepted 
        && !routingStore.pathContains('/terms')
      )
    )

    return (
      <AppWrapper blur={displayTermsPopup} id="AppWrapper">
        <ErrorBoundary>
          <MuiThemeProvider theme={this.theme}>
            {/* Global components are rendered here */}
            <WindowSizeListener onResize={this.handleWindowResize} />
            <DialogWrapper />

            {!isAnonymous && <Header />
            }
            <FixedBoundary className="fixed_boundary" />
            <FixedActivityLogWrapper>
              <ActivityLogBox />
            </FixedActivityLogWrapper>
            {displayTermsPopup &&
              <TermsOfUseModal currentUser={apiStore.currentUser} />
            }
            {/* Switch will stop when it finds the first matching path */}
            <Switch>
              <Route exact path="/" component={CollectionPage} />
              <Route path="/marketing" component={MarketingPage} />
              <Route path="/collections/:id" component={CollectionPage} />
              <Route path="/:org/collections/:id" component={CollectionPage} />
              <Route path="/items/:id" component={ItemPage} />
              <Route path="/:org/items/:id" component={ItemPage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/:org/search" component={SearchPage} />
              <Route path="/terms" component={TermsPage} />
              <Route
                path="/settings"
                render={() => <SettingsPage><OrganizationSettings /></SettingsPage>}
              />
              <Route
                path="/user_settings"
                render={() => <SettingsPage><UserSettings /></SettingsPage>}
              />
              {/* catch routes that we don't understand */}
              {/* TODO: refactor PageError to be a more standalone 404 page */}
              <Route exact path="/:org/:not_found" render={() => (<Redirect to="/" />)} />
              {/* have to put this last to catch all org slugs */}
              <Route exact path="/:org" component={CollectionPage} />
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
