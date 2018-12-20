import { Collection } from 'datx'
import { jsonapi, saveModel } from 'datx-jsonapi'
import { first, find } from 'lodash'
import { apiUrl as networkApiUrl } from '~shared/api.network.v1/util'

import * as networkModels from '~shared/api.network.v1'

class NetworkStore extends jsonapi(Collection) {
  static types = Object.values(networkModels).filter(x => !!x.type)

  firstResource(resourceName) {
    return first(this.findAll(resourceName))
  }

  get organization() {
    // NOTE: the way these methods work is that you are really only meant to have
    // one org, subscription, plan in session at a time.
    // That's why the load methods clear everything out first.
    return this.firstResource('organizations')
  }

  get subscription() {
    return this.firstResource('subscriptions')
  }

  get plan() {
    return this.firstResource('plans')
  }

  get defaultPaymentMethod() {
    const paymentMethods = this.findAll('payment_methods')
    return find(paymentMethods, x => x.default) || paymentMethods[0]
  }

  loadOrganization(external_id, skipCache = false) {
    // see note above about clearing everything out on load
    this.removeAll('organizations')
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
    this.removeAll('payment_methods')
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

  loadActiveSubscription(organization_id, skipCache = false) {
    this.removeAll('subscriptions')
    return this.fetchAll(
      'subscriptions',
      {
        filter: { organization_id, active: true },
      },
      {
        skipCache,
      }
    )
  }

  loadInvoices(organization_id) {
    this.removeAll('invoices')
    return this.fetchAll('invoices', {
      filter: { organization_id },
      sort: 'period_start',
    })
  }

  loadInvoice(invoice_id) {
    this.fetch('invoices', invoice_id, {
      include: [
        'organization',
        'subscriptions',
        'subscriptions.plan',
        'invoice_items',
        'payment_methods',
      ],
    })
  }

  loadPlans(organization_id) {
    this.fetchAll('plans')
  }

  async updateSubscription(organization_id) {
    await this.loadActiveSubscription(organization_id)
    if (!this.subscription.payment_method_id) {
      this.subscription.payment_method_id = this.defaultPaymentMethod.id
      await saveModel(this.subscription)
    }
  }

  async createPaymentMethod(organization, token) {
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

    const newPaymentMethod = new networkModels.PaymentMethod({
      stripe_card_token: token.id,
      name: card.name,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      address_zip: card.address_zip,
      address_country: card.country,
      organization_id: organization.id,
    })
    try {
      const paymentMethod = await saveModel(newPaymentMethod)
      this.add(paymentMethod)
      await this.updateSubscription(organization.id)
    } catch (e) {
      throw e
    }
  }

  async removePaymentMethod(paymentMethod) {
    // we don't use the built in model#destroy or collection#remove
    // because they have bugs in them.
    await this.request(
      `${networkApiUrl('payment_methods')}/${paymentMethod.id}`,
      'DELETE'
    )
    this.remove(paymentMethod, paymentMethod.id)
  }
}

export default NetworkStore
