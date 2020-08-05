import BillingInformation from '~/ui/billing/BillingInformation'
import Loader from '~/ui/layout/Loader'

let wrapper
const render = async (apiStore, networkStore) => {
  wrapper = shallow(
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
}

describe('BillingInformation', () => {
  let apiStore, networkStore

  beforeEach(() => {
    apiStore = {
      currentUserOrganizationId: 123,
      currentUserOrganization: {
        active_users_count: 0,
        trial_users_count: 0,
        trial_ends_at: '2022-01-01',
        is_within_trial_period: true,
        price_per_user: 5,
        current_billing_period_start: '2015-01-01',
        current_billing_period_end: '2015-01-31',
        deactivated: false,
        billable: true,
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
        expect(wrapper.find('FreeTrial').exists()).toBe(true)
      })
    })

    describe('trial expired', () => {
      beforeEach(() => {
        apiStore.currentUserOrganization.is_within_trial_period = false
        apiStore.currentUserOrganization.active_users_count = 20
      })

      it('renders without trial information', async () => {
        await render(apiStore, networkStore)
        expect(wrapper.find('FreeTrial').exists()).toBe(false)
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
        const hasBillableCount = wrapper.find('[data-jest="billableUserCount"]')
        expect(wrapper.find('FreeTrial').exists()).toBe(true)
        expect(hasBillableCount.prop('children')).toEqual(95)
      })
    })

    describe('with freemium users not over the limit', () => {
      beforeEach(() => {
        apiStore.currentUserOrganization.active_users_count = 3
        apiStore.currentUserOrganization.is_within_trial_period = false
      })

      it('renders the trial information', async () => {
        await render(apiStore, networkStore)
        expect(wrapper.find('FreeTrial').exists()).toBe(true)
        expect(wrapper.find('FancyDollarAmount').prop('children')).toEqual(0)
      })
    })

    describe('with freemium users are over the limit', () => {
      beforeEach(() => {
        apiStore.currentUserOrganization.active_users_count = 6
        apiStore.currentUserOrganization.is_within_trial_period = false
      })

      it('does not render the trial information', async () => {
        await render(apiStore, networkStore)
        expect(wrapper.find('FreeTrial').exists()).toBe(false)
        expect(wrapper.find('FancyDollarAmount').prop('children')).toEqual(30)
      })
    })
  })

  describe('in app billing disabled', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.in_app_billing = false
    })

    it('renders with the in app billing notice', async () => {
      await render(apiStore, networkStore)
    })

    it('does not render the trial information', async () => {
      await render(apiStore, networkStore)
      expect(wrapper.find('FreeTrial').exists()).toBe(false)
    })
  })
})
