import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import ReactRouterPropTypes from 'react-router-prop-types'
import PrintableInvoice from '~shared/components/compounds/PrintableInvoice'
import trackError from '~/utils/trackError'
import Box from '~shared/components/atoms/Box'

@inject('networkStore')
@observer
class BillingStatement extends React.Component {
  componentWillMount() {
    this.load()
  }

  async load() {
    const { networkStore, match } = this.props

    try {
      await networkStore.loadInvoice(match.params.id)
      this.forceUpdate()
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    const { networkStore, match } = this.props
    const invoice = networkStore.find('invoices', match.params.id)
    return invoice ? (
      <Box>
        <PrintableInvoice
          invoice={invoice}
          organization={invoice.organization}
          subscription={invoice.subscriptions[0]}
          brandTitle="Shape"
          logo={
            'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_1x.png'
          }
        />
      </Box>
    ) : null
  }
}

BillingStatement.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
}

BillingStatement.wrappedComponent.propTypes = {
  networkStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BillingStatement
