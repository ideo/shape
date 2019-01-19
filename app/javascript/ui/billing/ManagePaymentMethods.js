import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import trackError from '~/utils/trackError'
import PaymentMethods from '~shared/components/compounds/PaymentMethods'
import Loader from '~/ui/layout/Loader'
import AddCardModal from '~/ui/global/modals/AddCardModal'
import EmptyList from '~/ui/billing/EmptyList'
import styled from 'styled-components'
import v from '~/utils/variables'

const FinePrintWrapper = styled.div`
  font-family: Gotham;
  font-size: 14px;
  margin: 36px 0;
  color: ${v.colors.commonDarkest};
  a {
    color: ${v.colors.ctaPrimary};
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
    const { currentUserOrganization } = apiStore
    try {
      await networkStore.loadOrganization(apiStore.currentUserOrganizationId)
      if (networkStore.organization) {
        // if no org there's probably an error, e.g. on dev when the external_id org isn't there
        await networkStore.loadPaymentMethods(networkStore.organization.id)
        if (this.paymentMethods.length > 0 && currentUserOrganization.overdue) {
          apiStore.checkCurrentOrganizationPayments()
        }
      }
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
    const {
      networkStore: { organization, loadPaymentMethods },
    } = this.props
    paymentMethod.default = true
    await paymentMethod.save()
    await loadPaymentMethods(organization.id, true)
    this.forceUpdate()
  }

  destroyPaymentMethod = async paymentMethod => {
    await this.props.networkStore.removePaymentMethod(paymentMethod)
    this.forceUpdate()
  }

  get paymentMethods() {
    const { networkStore } = this.props
    return networkStore.findAll('payment_methods')
  }

  tokenCreated = closeModal => async token => {
    const { apiStore } = this.props
    const { networkStore } = this.props
    await networkStore.createPaymentMethod(networkStore.organization, token)
    apiStore.checkCurrentOrganizationPayments()
    this.forceUpdate()
    closeModal()
  }

  render() {
    const { apiStore } = this.props
    const { paymentMethods } = this
    if (!apiStore.currentUserOrganization.in_app_billing) {
      return null
    }
    if (!this.loaded) {
      return <Loader />
    }
    return (
      <PaymentMethods
        paymentMethods={paymentMethods}
        updatePaymentMethod={this.updatePaymentMethod}
        makePaymentMethodDefault={this.makePaymentMethodDefault}
        destroyPaymentMethod={this.destroyPaymentMethod}
        tokenCreated={this.tokenCreated}
        ModalContainer={AddCardModal}
        BackdropComponent={({ children }) => <div />}
        NoPaymentMethodsComponent={() => (
          <EmptyList>No payments methods currently on file</EmptyList>
        )}
        FinePrintComponent={() => (
          <FinePrintWrapper>
            By accepting these Terms of Use, after the expiry of any free trial
            period, you will be charged $
            {apiStore.currentUserOrganization.price_per_user} per month per
            active user until you cancel. You can cancel at any time by
            accessing the billing page and unsubscribing or by contacting us at{' '}
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
