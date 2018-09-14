import { inject, observer } from 'mobx-react'
import { Heading1 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import ManagePaymentMethods from '~/ui/billing/ManagePaymentMethods'

@inject('networkStore')
@observer
class BillingPage extends React.Component {
  render() {
    const paymentMethods = this.props.networkStore.findAll('payment_methods')
    console.log('outer render', paymentMethods.length)
    return (
      <div>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>Billing</Heading1>
          <ManagePaymentMethods foo={paymentMethods}/>
        </PageContainer>
      </div>
    )
  }
}

export default BillingPage
