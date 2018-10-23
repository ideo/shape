import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import trackError from '~/utils/trackError'
import PaymentMethods from '~shared/components/compounds/PaymentMethods'
import Loader from '~/ui/layout/Loader'
import EmptyList from '~/ui/billing/EmptyList'
import styled from 'styled-components'

const FinePrintWrapper = styled.div`
  font-family: Gotham;
  font-size: 14px;
  margin: 36px 0;
  color: #787878;
  a {
    color: #009fe3;
    text-decoration: none;
  }
`

@inject('apiStore', 'networkStore')
@observer
class ManagePaymentMethods extends React.Component {
  @observable
  loaded = false

  componentWillMount() {
    this.loadPaymentMethods()
  }

  async loadPaymentMethods() {
    const { apiStore, networkStore } = this.props

    try {
      await networkStore.loadOrganization(apiStore.currentUserOrganizationId)
      await networkStore.loadPaymentMethods(networkStore.organization.id)
      runInAction(() => (this.loaded = true))
      this.forceUpdate()
    } catch (e) {
      trackError(e)
    }
  }

  updatePaymentMethod = async paymentMethod => {
    await paymentMethod.save()
    this.forceUpdate()
  }

  makePaymentMethodDefault = async paymentMethod => {
    paymentMethod.default = true
    await paymentMethod.save()
    await this.props.networkStore.loadPaymentMethods(
      this.props.networkStore.organization.id,
      true
    )
    this.forceUpdate()
  }

  destroyPaymentMethod = async paymentMethod => {
    await this.props.networkStore.remove(paymentMethod, true)
    this.forceUpdate()
  }

  tokenCreated = closeModal => async token => {
    await this.props.networkStore.createPaymentMethod(
      this.props.networkStore.organization,
      token
    )
    this.forceUpdate()
    closeModal()
  }

  render() {
    if (!this.loaded) {
      return <Loader />
    }
    const paymentMethods = this.props.networkStore.findAll('payment_methods')

    return (
      <PaymentMethods
        paymentMethods={paymentMethods}
        updatePaymentMethod={this.updatePaymentMethod}
        makePaymentMethodDefault={this.makePaymentMethodDefault}
        destroyPaymentMethod={this.destroyPaymentMethod}
        tokenCreated={this.tokenCreated}
        NoPaymentMethodsComponent={() => (
          <EmptyList>No payments methods currently on file</EmptyList>
        )}
        FinePrintComponent={() => (
          <FinePrintWrapper>
            By accepting these Terms of Use, after the expiry of any free trial
            period, you will be charged $5 per month per active user until you
            cancel. You can cancel at any time by accessing the billing page and
            unsubscribing or by contacting us at{' '}
            <a href="mailto:help@shape.space">help@shape.space</a>. If you
            cancel, you still may be charged for the current billing period. By
            clicking &quot;Add Card&quot;, you agree to these and our other{' '}
            <a href="/terms" target="_blank">
              Terms of Use
            </a>
            .
          </FinePrintWrapper>
        )}
      />
    )
  }
}

ManagePaymentMethods.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  networkStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ManagePaymentMethods
