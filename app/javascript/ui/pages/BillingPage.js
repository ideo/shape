import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import { Heading1 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import PaymentMethods from '~shared/components/compounds/PaymentMethods'
import { networkStore } from '~/stores'

@inject('apiStore')
@observer
class BillingPage extends React.Component {
  @observable loaded = false
  @observable paymentMethods = []

  async loadPaymentMethods() {
    try {
      const networkOrganization = await networkStore.loadOrganization(this.props.apiStore.currentUserOrganizationId)
      const paymentMethods = await networkStore.loadPaymentMethods(networkOrganization.id)
      runInAction(() => {
        this.paymentMethods = paymentMethods
        this.loaded = true
      })
    } catch(e) {
      console.log(e)
    }
  }

  componentDidMount() {
    this.loadPaymentMethods()
  }

  updatePaymentMethod() {
  }

  makePaymentMethodDefault() {
  }

  destroyPaymentMethod() {
  }

  tokenCreated() {
  }

  render() {
    return (
      <div>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>Billing</Heading1>
          <PaymentMethods
            paymentMethods={this.paymentMethods}
            updatePaymentMethod={this.updatePaymentMethod}
            makePaymentMethodDefault={this.makePaymentMethodDefault}
            destroyPaymentMethod={this.destroyPaymentMethod}
            tokenCreated={this.tokenCreated}
            />
        </PageContainer>
      </div>
    )
  }
}

export default BillingPage
