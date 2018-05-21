import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Switch, Route, withRouter } from 'react-router-dom'
import WindowSizeListener from 'react-window-size-listener'
import styled from 'styled-components'

import DialogWrapper from '~/ui/global/modals/DialogWrapper'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import SearchPage from '~/ui/pages/SearchPage'
import TermsPage from '~/ui/pages/TermsPage'
import SettingsPage from '~/ui/pages/SettingsPage'
import TermsOfUseModal from '~/ui/users/TermsOfUseModal'
import Loader from '~/ui/layout/Loader'
import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'
import initDoorbell from '~/vendor/doorbell'
import v from '~/utils/variables'

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
  componentDidMount() {
    const { apiStore } = this.props
    apiStore.loadCurrentUserAndGroups().then(() => {
      initDoorbell(apiStore.currentUser)
    })
  }

  handleWindowResize = ({ windowWidth }) => {
    // NOTE: Routes should only interact with uiStore for global re-rendering changes like this
    const { uiStore } = this.props
    uiStore.updateColumnsToFit(windowWidth)
    uiStore.updateActivityLogWidth(windowWidth)
  }

  render() {
    const { apiStore, routingStore } = this.props
    if (!apiStore.currentUser) {
      return <Loader />
    }
    const displayTermsPopup = (
      !apiStore.currentUser.terms_accepted && !routingStore.pathContains('/terms')
    )

    return (
      <AppWrapper blur={displayTermsPopup}>
        {/* Global components are rendered here */}
        <WindowSizeListener onResize={this.handleWindowResize} />
        <DialogWrapper />

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
          <Route path="/collections/:id" component={CollectionPage} />
          <Route path="/items/:id" component={ItemPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/settings" component={SettingsPage} />
        </Switch>
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
