import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import trackError from '~/utils/trackError'
import Invoices from '~shared/components/compounds/Invoices'
import Loader from '~/ui/layout/Loader'
import EmptyList from '~/ui/billing/EmptyList'

@inject('apiStore', 'networkStore')
@observer
class ManagePaymentMethods extends React.Component {
  @observable
  loaded = false

  componentWillMount() {
    this.loadInvoices()
  }

  async loadInvoices() {
    const { apiStore, networkStore } = this.props

    try {
      await networkStore.loadOrganization(apiStore.currentUserOrganizationId)
      await networkStore.loadInvoices(networkStore.organization.id)
      runInAction(() => (this.loaded = true))
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    if (!this.loaded) {
      return <Loader />
    }
    const invoices = this.props.networkStore.findAll('invoices')
    return (
      <Invoices
        invoices={invoices}
        NoInvoicesComponent={() => (
          <EmptyList>No previous billing statements to show</EmptyList>
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
