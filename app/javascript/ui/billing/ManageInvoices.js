import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import trackError from '~/utils/trackError'
import Invoices from '~shared/components/compounds/Invoices'

@inject('apiStore', 'networkStore')
@observer
class ManagePaymentMethods extends React.Component {
  componentWillMount() {
    this.loadInvoices()
  }

  async loadInvoices() {
    const { apiStore, networkStore } = this.props

    try {
      await networkStore.loadOrganization(apiStore.currentUserOrganizationId)
      await networkStore.loadSubscription(networkStore.organization.id)
      if (networkStore.subscription) {
        await networkStore.loadInvoices(networkStore.subscription)
        this.forceUpdate()
      }
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    const invoices = this.props.networkStore.findAll('invoices')
    return invoices.length < 1 ? null : <Invoices invoices={invoices} />
  }
}

ManagePaymentMethods.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  networkStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ManagePaymentMethods
