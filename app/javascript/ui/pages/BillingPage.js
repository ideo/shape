import { Heading1 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import ManagePaymentMethods from '~/ui/billing/ManagePaymentMethods'

class BillingPage extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>Billing</Heading1>
          <ManagePaymentMethods />
        </PageContainer>
      </div>
    )
  }
}

export default BillingPage
