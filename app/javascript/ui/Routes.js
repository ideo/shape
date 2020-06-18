import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Fragment } from 'react'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import { MuiThemeProvider } from '@material-ui/core/styles'
import WindowSizeListener from 'react-window-size-listener'
import styled from 'styled-components'
import _ from 'lodash'

import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'
import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import ErrorBoundary from '~/ui/global/ErrorBoundary'
import ZendeskWidget from '~/ui/global/ZendeskWidget'
import AppendUtmParams from '~/utils/googleAnalytics/AppendUtmParams'
import Header from '~/ui/layout/Header'
import CreateOrgPage from '~/ui/pages/CreateOrgPage'
import {
  CollectionApiWrapper,
  ItemApiWrapper,
} from '~/ui/pages/PageWithApiWrapper'
import Loader from '~/ui/layout/Loader'
import LowerRightCorner from '~/ui/global/LowerRightCorner'
import SearchPage from '~/ui/pages/SearchPage'
import SettingsPage from '~/ui/pages/SettingsPage'
import TermsPage from '~/ui/pages/TermsPage'
import BillingPage from '~/ui/pages/BillingPage'
import BillingStatement from '~/ui/pages/BillingStatement'
import TermsOfUseModal from '~/ui/users/TermsOfUseModal'
import OrganizationSettings from '~/ui/organizations/OrganizationSettings'
import UserSettings from '~/ui/users/UserSettings'
import v from '~/utils/variables'
import firebaseClient from '~/vendor/firebase/clients/firebaseClient'
import MuiTheme, { BillingMuiTheme } from '~/ui/theme'
import captureGlobalKeypress, {
  handleMouseDownSelection,
} from '~/utils/captureGlobalKeypress'
import { pageBoundsScroller } from '~/utils/ScrollNearPageBoundsService'

const AppWrapper = styled.div`
  /* used by terms of use modal to blur the whole site */
  ${props =>
    props.blur &&
    `
    filter: blur(10px);
  `};
  // Global print styling rules
  @media print {
    body {
      background: ${v.colors.white};
    }
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    header {
      display: block;
    }
    img {
      max-width: 100% !important;
    }
    body,
    article {
      width: 100%;
      margin: 0;
      padding: 0;
    }
  }
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

const SelectedArea = styled.div.attrs(({ coords }) => ({
  style: {
    left: `${coords.left}px`,
    top: `${coords.top}px`,
    height: `${coords.height}px`,
    width: `${coords.width}px`,
  },
}))`
  background-color: rgba(192, 219, 222, 0.4);
  position: absolute;
  z-index: ${v.zIndex.clickWrapper};
`

// withRouter allows it to respond automatically to routing changes in props
@withRouter
@inject('apiStore', 'uiStore', 'routingStore')
@observer
class Routes extends React.Component {
  constructor(props) {
    super(props)
    this.mouseDownAt = { x: null, y: null }
    this.throttledSetSelectedArea = _.throttle(this._setSelectedArea, 25)
  }

  componentDidMount() {
    const { apiStore } = this.props
    apiStore.loadCurrentUser({
      onSuccess: currentUser => {
        firebaseClient.authenticate(currentUser.google_auth_token)
      },
      // had to turn this off because SameSite cookie doesn't work on some versions of Safari
      // https://bit.ly/3axsLgw
      checkIdeoSSO: false,
    })

    document.addEventListener('keydown', captureGlobalKeypress)
    document.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    })
    document.addEventListener('touchend', this.handleTouchMove, {
      passive: false,
    })
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', captureGlobalKeypress)
    document.removeEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    })
    document.removeEventListener('touchend', this.handleTouchMove, {
      passive: false,
    })
  }

  handleWindowResize = ({ windowWidth }) => {
    // NOTE: Routes should only interact with uiStore for global re-rendering changes like this
    const { uiStore } = this.props
    const { viewingCollection } = uiStore
    uiStore.updateColumnsToFit(windowWidth)
    uiStore.updateActivityLogWidth(windowWidth)
    uiStore.update('windowWidth', windowWidth)
    if (viewingCollection && viewingCollection.isBoard) {
      uiStore.determineZoomLevels(viewingCollection)
    }
  }

  handleMouseDownSelection = e => {
    const globalClick = handleMouseDownSelection(e)
    if (globalClick === 'emptySpace') {
      this.mouseDownAt = { x: e.pageX, y: e.pageY }
    }
  }

  handleMouseMoveSelection = e => {
    // Return if mouse is only scrolling, not click-dragging
    if (!this.mouseDownAt.x) return

    // Stop propagation if dragging so it doesn't trigger other events
    e.stopPropagation()
    e.preventDefault()
    // persist to be used in throttled function below
    e.persist()

    this.throttledSetSelectedArea(
      {
        minX: _.min([e.pageX, this.mouseDownAt.x]),
        maxX: _.max([e.pageX, this.mouseDownAt.x]),
        minY: _.min([e.pageY, this.mouseDownAt.y]),
        maxY: _.max([e.pageY, this.mouseDownAt.y]),
      },
      e
    )
  }

  handleMouseUpSelection = e => {
    if (!this.mouseDownAt.x) return

    // Stop propagation if dragging so it doesn't trigger other events
    e.stopPropagation()
    e.preventDefault()

    // Reset for next drag
    this.mouseDownAt = { x: null, y: null }

    // Cancel any currently throttled calls
    this.throttledSetSelectedArea.cancel()
    // clear selected area (enabling BCT to open)
    this._setSelectedArea({
      minX: null,
      maxX: null,
      minY: null,
      maxY: null,
    })
    pageBoundsScroller.setScrolling(false)
  }

  handleTouchMove = e => {
    const { uiStore } = this.props
    if (uiStore.dragging || uiStore.activityLogMoving) {
      e.preventDefault()
    }
    this._dismissActivityLogBox(e)
  }

  _setSelectedArea = (coords, e = {}) => {
    const { uiStore } = this.props
    const shifted = e.shiftKey
    if (!_.isEmpty(e)) {
      pageBoundsScroller.scrollIfNearPageBounds(e, { speed: 1.5 })
    }
    uiStore.setSelectedArea(coords, { shifted })
  }

  _dismissActivityLogBox = e => {
    const { uiStore, apiStore } = this.props

    if (
      !e.target.closest('.activity_log-draggable') &&
      uiStore.activityLogOpen
    ) {
      // close activity log when scroll happens outside of it
      uiStore.setCommentingOnRecord(null)
      uiStore.update('activityLogOpen', false)
      apiStore.collapseReplies()
    }
  }

  // Props for the div that shows area selected
  get selectedAreaStyleProps() {
    const {
      selectedArea: { minX, maxX, minY, maxY },
    } = this.props.uiStore
    return {
      top: minY,
      left: minX,
      height: maxY - minY,
      width: maxX - minX,
    }
  }

  goToRoot = () => {
    const { apiStore } = this.props
    if (apiStore.currentOrgSlug) {
      return <Redirect to={`/${apiStore.currentOrgSlug}`} />
    } else {
      return (
        <Fragment>
          <AppendUtmParams />
          <CreateOrgPage />
        </Fragment>
      )
    }
  }

  render() {
    const { apiStore, routingStore } = this.props
    const { sessionLoaded, currentUser } = apiStore
    if (!sessionLoaded) {
      return <Loader />
    }
    const termsAccepted = currentUser && currentUser.current_org_terms_accepted
    const displayTermsPopup =
      currentUser &&
      (!termsAccepted || termsAccepted === 'outdated') &&
      !routingStore.pathContains('/terms')

    const {
      uiStore: { selectedAreaEnabled },
    } = apiStore

    return (
      <AppWrapper
        onMouseDown={this.handleMouseDownSelection}
        onMouseUp={this.handleMouseUpSelection}
        onMouseMove={this.handleMouseMoveSelection}
        blur={displayTermsPopup}
        id="AppWrapper"
      >
        <LowerRightCorner />
        {selectedAreaEnabled && (
          <SelectedArea coords={this.selectedAreaStyleProps} />
        )}
        <ErrorBoundary>
          <MuiThemeProvider theme={MuiTheme}>
            {/* Global components are rendered here */}
            <WindowSizeListener onResize={this.handleWindowResize} />
            <DialogWrapper />
            <ZendeskWidget />

            <Header />

            <FixedBoundary className="fixed_boundary" data-empty-space-click />
            <FixedActivityLogWrapper>
              <ActivityLogBox />
            </FixedActivityLogWrapper>
            {displayTermsPopup && <TermsOfUseModal currentUser={currentUser} />}
            {/* Capture google analytics params if not root path */}
            <Route path="/(.+)" render={() => <AppendUtmParams />} />
            {/* Switch will stop when it finds the first matching path */}
            <Switch>
              <Route exact path="/" render={this.goToRoot} />
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
                render={props => (
                  // There must be a better way to apply BillingMuiTheme to all billing pages,
                  // however sticking MuiThemeProvider within the <Switch> made it angry
                  <MuiThemeProvider theme={BillingMuiTheme}>
                    <BillingPage {...props} />
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
                render={props => <CollectionApiWrapper {...props} />}
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
