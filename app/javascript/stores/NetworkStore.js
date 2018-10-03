import { Collection } from 'datx'
import { jsonapi, saveModel } from 'datx-jsonapi'
import { first } from 'lodash'

import * as networkModels from '~shared/api.network.v1'

class NetworkStore extends jsonapi(Collection) {
  static types = Object.values(networkModels).filter(x => !!x.type)

  get organization() {
    return first(this.findAll('organizations'))
  }

  loadOrganization(external_id, skipCache = false) {
    return this.fetchAll(
      'organizations',
      {
        filter: { external_id },
      },
      {
        skipCache,
      }
    )
  }

  loadPaymentMethods(organization_id, skipCache = false) {
    return this.fetchAll(
      'payment_methods',
      {
        sort: '-default,exp_year,exp_month',
        filter: { organization_id },
      },
      {
        skipCache,
      }
    )
  }

  createPaymentMethod(organization, token) {
    const { card } = token
    if (!card) {
      throw new Error('Missing card')
    }
    if (!card.name) {
      throw new Error('Missing card name')
    }
    if (!card.address_zip) {
      throw new Error('Missing card address zip')
    }

    const paymentMethod = new networkModels.PaymentMethod({
      stripe_card_token: token.id,
      name: card.name,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      address_zip: card.address_zip,
      address_country: card.country,
      isDefault: false,
      organization_id: organization.id,
    })
    return saveModel(paymentMethod).then(() => this.add(paymentMethod))
  }
}

export default NetworkStore
