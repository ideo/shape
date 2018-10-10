import { Collection } from 'datx'
import { jsonapi, saveModel } from 'datx-jsonapi'
import { first, find } from 'lodash'

import * as networkModels from '~shared/api.network.v1'

class NetworkStore extends jsonapi(Collection) {
  static types = Object.values(networkModels).filter(x => !!x.type)

  firstResource(resourceName) {
    return first(this.findAll(resourceName))
  }

  get organization() {
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

  loadSubscription(organization_id, skipCache = false) {
    return this.fetchAll(
      'subscriptions',
      {
        filter: { organization_id },
      },
      {
        skipCache,
      }
    )
  }

  loadInvoices(subscription_id) {
    return this.fetchAll('invoices', {
      filter: { subscription_id },
      sort: 'period_start',
    })
  }

  loadInvoice(invoice_id) {
    this.fetch('invoices', invoice_id, {
      include: ['organization', 'invoice_items', 'payment_methods'],
    })
  }

  loadPlans(organization_id) {
    this.fetchAll('plans')
  }

  async createSubscription(organization_id) {
    await this.loadSubscription(organization_id)
    if (this.subscription) {
      return
    }
    const newSubscription = new networkModels.Subscription({
      plan_id: this.plan.id,
      payment_method_id: this.defaultPaymentMethod.id,
    })
    const subscription = await saveModel(newSubscription)
    this.add(subscription)
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
      isDefault: false,
    })
    try {
      const paymentMethod = await saveModel(newPaymentMethod)
      this.add(paymentMethod)
      await this.createSubscription(organization.id)
    } catch (e) {
      throw e
    }
  }
}

export default NetworkStore
