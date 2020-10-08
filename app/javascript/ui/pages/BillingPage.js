import { Grid } from '@material-ui/core'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Box from '~shared/components/atoms/Box'
import { Heading1 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import PageContainer from '~/ui/layout/PageContainer'
import BillingMenu from '~/ui/billing/BillingMenu'
import BillingInformation from '~/ui/billing/BillingInformation'
import SuperAdminBillingControls from '~/ui/billing/SuperAdminBillingControls'
import ReactivateAccount from '~/ui/billing/ReactivateAccount'
import ManagePaymentMethods from '~/ui/billing/ManagePaymentMethods'
import ManageInvoices from '~/ui/billing/ManageInvoices'
import OverdueBanner from '~/ui/layout/OverdueBanner'
import ReactRouterPropTypes from 'react-router-prop-types'
import { hasKeyValueParam } from '~/utils/paramUtils'
import IdeoSSO from '~/utils/IdeoSSO'

@inject('apiStore', 'routingStore')
@observer
class BillingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      openPaymentMethod: false,
    }
  }
  componentDidMount() {
    const { routingStore } = this.props
    // kick out if you're not logged-in
    if (!this.organization) {
      return routingStore.routeToLogin({ redirect: '/settings' })
    }

    // kick out if you're not an org admin (i.e. primary_group admin)
    if (!this.organization.primary_group.can_edit) {
      routingStore.routeTo('homepage')
    }
    IdeoSSO.getUserInfo().catch(e => {
      // for some reason currentUser.logout() does not seem to be behaving here.
      IdeoSSO.logout('/login')
    })
    const paramString = this.props.location.search
    if (hasKeyValueParam(paramString, 'openPaymentMethod', 'true')) {
      this.setState({ openPaymentMethod: true })
    }
  }

  get organization() {
    const { apiStore } = this.props
    return apiStore.currentUserOrganization
  }

  render() {
    if (!this.organization) return null

    return (
      <Box mb={v.headerHeight}>
        <OverdueBanner />
        <PageContainer>
          <Heading1>
            <Grid container justify="space-between">
              <Grid item>Billing</Grid>
              <Grid item>
                <BillingMenu />
              </Grid>
            </Grid>
          </Heading1>
          <SuperAdminBillingControls />
          <ReactivateAccount />
          <BillingInformation />
          <ManagePaymentMethods
            openPaymentMethod={this.state.openPaymentMethod}
          />
          <ManageInvoices />
        </PageContainer>
      </Box>
    )
  }
}

BillingPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

BillingPage.propTypes = {
  location: ReactRouterPropTypes.location.isRequired,
}

export default BillingPage
