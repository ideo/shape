import BillingInformation from '~/ui/billing/BillingInformation'
import { shallow } from 'enzyme'
import Loader from '~/ui/layout/Loader'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const render = async (apiStore, networkStore) => {
  const wrapper = shallow(
    <BillingInformation.wrappedComponent
      apiStore={apiStore}
      networkStore={networkStore}
    />
  )

  expect(wrapper.find(Loader).exists()).toBe(true)
  await Promise.all([networkStore.loadOrganization, networkStore.loadPlans])
  wrapper.update()
  expect(wrapper.find(Loader).exists()).toBe(false)
  expect(networkStore.loadOrganization).toHaveBeenCalledWith(
    apiStore.currentUserOrganizationId
  )
  expect(networkStore.loadPlans).toHaveBeenCalledWith(
    apiStore.currentUserOrganizationId
  )
  expectTreeToMatchSnapshot(wrapper)
}

describe('BillingInformation', () => {
  let apiStore, networkStore

  beforeEach(() => {
    apiStore = {
      currentUserOrganizationId: 123,
      currentUserOrganization: {
        active_users_count: 0,
        trial_users_count: 0,
        trial_ends_at: '01/01/2022',
        is_within_trial_period: true,
        price_per_user: 1.23,
        current_billing_period_start: '01/01/2015',
        current_billing_period_end: '01/31/2015',
        deactivated: false,
      },
    }
    networkStore = {
      loadOrganization: jest.fn(() => Promise.resolve()),
      loadPlans: jest.fn(() => Promise.resolve()),
    }
  })

  describe('organization is deactivated', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.deactivated = true
    })

    it('renders nothing', async () => {
      await render(apiStore, networkStore)
    })
  })

  describe('in app billing enabled', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.in_app_billing = true
    })
    describe('still within trial', () => {
      beforeEach(() => {
        apiStore.currentUserOrganization.is_within_trial_period = true
        apiStore.currentUserOrganization.trial_users_count = 10
        apiStore.currentUserOrganization.active_users_count = 5
      })
      it('renders trial information', async () => {
        await render(apiStore, networkStore)
      })
    })

    describe('trial expired', () => {
      beforeEach(() => {
        apiStore.currentUserOrganization.is_within_trial_period = false
        apiStore.currentUserOrganization.active_users_count = 20
      })

      it('renders without trial information', async () => {
        await render(apiStore, networkStore)
      })
    })

    describe('within trial, exceeded trial users', () => {
      beforeEach(() => {
        apiStore.currentUserOrganization.is_within_trial_period = true
        apiStore.currentUserOrganization.trial_users_count = 5
        apiStore.currentUserOrganization.active_users_count = 100
      })

      it('renders with trial and billing information', async () => {
        await render(apiStore, networkStore)
      })
    })
  })

  describe('in app billing disabled', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.in_app_billing = true
    })

    it('renders with the in app billing notice', async () => {
      await render(apiStore, networkStore)
    })
  })
})
