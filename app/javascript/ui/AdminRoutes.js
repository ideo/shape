import styled from 'styled-components'
import WindowSizeListener from 'react-window-size-listener'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { Box } from 'reflexbox'

import AdminPage from '~/ui/pages/AdminPage'
import BasicHeader from '~/ui/layout/BasicHeader'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import ErrorBoundary from '~/ui/global/ErrorBoundary'
import Loader from '~/ui/layout/Loader'
import MuiTheme from '~/ui/theme'
import SearchPage from '~/ui/pages/SearchPage'
import SettingsPage from '~/ui/pages/SettingsPage'
import UserSettings from '~/ui/users/UserSettings'
import ZendeskWidget from '~/ui/global/ZendeskWidget'
import firebaseClient from '~/vendor/firestore'
import v from '~/utils/variables'
import { CollectionApiWrapper } from '~/ui/pages/PageWithApiWrapper'

const StyledHeadingWrapper = styled.div`
  margin-left: 0.5rem;
  margin-top: 0.5rem;
  height: 1.2rem;
  white-space: nowrap;
  line-height: 1;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  color: ${v.colors.black};
`

// withRouter allows it to respond automatically to routing changes in props
@withRouter
@inject('apiStore', 'uiStore')
@observer
class AdminRoutes extends React.Component {
  componentDidMount() {
    const { apiStore } = this.props
    apiStore.loadCurrentUser({
      onSuccess: currentUser => {
        firebaseClient.authenticate(currentUser.google_auth_token)
      },
    })
  }

  handleWindowResize = ({ windowWidth }) => {
    // NOTE: Routes should only interact with uiStore for global re-rendering changes like this
    const { uiStore } = this.props
    uiStore.updateColumnsToFit(windowWidth)
    uiStore.updateActivityLogWidth(windowWidth)
    uiStore.update('windowWidth', windowWidth)
  }

  render() {
    const { apiStore } = this.props
    const { sessionLoaded } = apiStore
    if (!sessionLoaded) {
      return <Loader />
    }
    return (
      <ErrorBoundary>
        <MuiThemeProvider theme={MuiTheme}>
          <WindowSizeListener onResize={this.handleWindowResize} />
          <DialogWrapper />
          <ZendeskWidget />

          <BasicHeader orgMenu={false}>
            <Box auto>
              <StyledHeadingWrapper>Shape Admin</StyledHeadingWrapper>
            </Box>
          </BasicHeader>

          {/* Switch will stop when it finds the first matching path */}
          <Switch>
            <Route path="/admin" component={AdminPage} />
            <Route path="/search" component={SearchPage} />
            <Route path="/:org/search" component={SearchPage} />
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
              render={props => <CollectionApiWrapper {...props} />}
            />
          </Switch>
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}

AdminRoutes.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminRoutes
