import { Heading1 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import BillingInformation from '~/ui/billing/BillingInformation'
import SuperAdminBillingControls from '~/ui/billing/SuperAdminBillingControls'
import ManagePaymentMethods from '~/ui/billing/ManagePaymentMethods'
import ManageInvoices from '~/ui/billing/ManageInvoices'
import Box from '~shared/components/atoms/Box'
import OverdueBanner from '~/ui/layout/OverdueBanner'

class BillingPage extends React.Component {
  render() {
    return (
      <Box mb={v.headerHeightCompact}>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>Billing</Heading1>
          <OverdueBanner />
          <SuperAdminBillingControls />
          <BillingInformation />
          <ManagePaymentMethods />
          <ManageInvoices />
        </PageContainer>
      </Box>
    )
  }
}

export default BillingPage
