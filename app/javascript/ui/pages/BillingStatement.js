import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import ReactRouterPropTypes from 'react-router-prop-types'
import PrintableInvoice from '~shared/components/compounds/PrintableInvoice'
import trackError from '~/utils/trackError'

@inject('apiStore', 'networkStore')
@observer
class BillingStatement extends React.Component {
  componentWillMount() {
    this.load()
  }

  async load() {
    const { apiStore, networkStore, match } = this.props

    try {
      await networkStore.loadOrganization(apiStore.currentUserOrganizationId)
      await networkStore.loadSubscription(networkStore.organization.id)
      await networkStore.loadInvoice(match.params.id)
      this.forceUpdate()
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    const { networkStore, match } = this.props
    const invoice = networkStore.find('invoices', match.params.id)
    const { organization, subscription } = networkStore
    return invoice && organization && subscription ? (
      <PrintableInvoice
        invoice={invoice}
        organization={networkStore.organization}
        subscription={networkStore.subscription}
        />
    ) : null
  }
}

BillingStatement.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
}

BillingStatement.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  networkStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BillingStatement
