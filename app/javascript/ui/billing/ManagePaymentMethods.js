import { inject, observer } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import { modelToJsonApi, saveModel } from 'datx-jsonapi'
import { Heading1 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import PaymentMethods from '~shared/components/compounds/PaymentMethods'

@inject('apiStore', 'networkStore')
@observer
class ManagePaymentMethods extends React.Component {
  async loadPaymentMethods() {
    const { apiStore, networkStore } = this.props

    try {
      await networkStore.loadOrganization(apiStore.currentUserOrganizationId)
      await networkStore.loadPaymentMethods(networkStore.organization.id)
      // this.forceUpdate()
    } catch (e) {
      console.log(e)
    }
  }

  componentWillMount() {
    this.loadPaymentMethods()
  }

  updatePaymentMethod = async paymentMethod => {
    await paymentMethod.save()
    // this.forceUpdate()
  }

  makePaymentMethodDefault = async paymentMethod => {
    paymentMethod.default = true
    await paymentMethod.save()
    await this.props.networkStore.loadPaymentMethods(
      this.props.networkStore.organization.id,
      true
    )
    // this.forceUpdate()
  }

  destroyPaymentMethod = async paymentMethod => {
    await this.props.networkStore.remove(paymentMethod, true)
    // this.forceUpdate()
  }

  tokenCreated = closeModal => async token => {
    await this.props.networkStore.createPaymentMethod(
      this.props.networkStore.organization,
      token
    )
    // this.forceUpdate()
    closeModal()
  }

  render() {
    // const paymentMethods = this.props.networkStore.findAll('payment_methods')
    console.log('inner render', this.props.foo.length)
    // this.props.foo.forEach(x => console.log(x.default))

    this.props.foo.forEach(x => {
      const jsonApi = modelToJsonApi(x)
    })

    return (
      <PaymentMethods
        paymentMethods={this.props.foo}
        updatePaymentMethod={this.updatePaymentMethod}
        makePaymentMethodDefault={this.makePaymentMethodDefault}
        destroyPaymentMethod={this.destroyPaymentMethod}
        tokenCreated={this.tokenCreated}
      />
    )
  }
}

export default ManagePaymentMethods
