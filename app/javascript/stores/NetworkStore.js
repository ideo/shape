import { Collection } from 'datx'
import { jsonapi } from 'datx-jsonapi'
import { first } from 'lodash'

import * as networkModels from '~shared/api.network.v1'

class NetworkStore extends jsonapi(Collection) {
  static types = Object.keys(networkModels).filter(x => x.type)

  loadOrganization(external_id) {
    return this
      .fetchAll('organizations', {
        filter: {external_id}
      }).then(response => first(response.data))
  }

  loadPaymentMethods(organization_id) {
    return this
      .fetchAll('payment_methods', {
        sort: '-default,exp_year,exp_month',
        filter: {organization_id},
      }).then(response => response.data)
  }
}

export default NetworkStore
