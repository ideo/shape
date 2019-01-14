import { Grid } from '@material-ui/core'
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

import { apiStore, routingStore } from '~/stores'

class BillingPage extends React.Component {
  componentDidMount() {
    // kick out if you're not an org admin (i.e. primary_group admin)
    if (!apiStore.currentUserOrganization.primary_group.can_edit) {
      routingStore.routeTo('homepage')
    }
    IdeoSSO.getUserInfo().catch(e => {
      // for some reason currentUser.logout() does not seem to be behaving here.
      IdeoSSO.logout('/login')
    })
  }

  render() {
    return (
      <Box mb={v.headerHeightCompact}>
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>
            <Grid container justify="space-between">
              <Grid item>Billing</Grid>
              <Grid item>
                <BillingMenu />
              </Grid>
            </Grid>
          </Heading1>
          <OverdueBanner />
          <SuperAdminBillingControls />
          <ReactivateAccount />
          <BillingInformation />
          <ManagePaymentMethods />
          <ManageInvoices />
        </PageContainer>
      </Box>
    )
  }
}

export default BillingPage
