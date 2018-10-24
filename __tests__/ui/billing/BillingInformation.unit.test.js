import BillingInformation from '~/ui/billing/BillingInformation'
import { shallow } from 'enzyme'
import Loader from '~/ui/layout/Loader'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

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
      },
    }
    networkStore = {
      loadOrganization: jest.fn(() => Promise.resolve()),
      loadPlans: jest.fn(() => Promise.resolve()),
    }
  })
  describe('still within trial', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.is_within_trial_period = true
      apiStore.currentUserOrganization.trial_users_count = 10
      apiStore.currentUserOrganization.active_users_count = 5
    })
    it('renders trial information', async () => {
      const wrapper = shallow(
        <BillingInformation.wrappedComponent
          apiStore={apiStore}
          networkStore={networkStore}
        />
      )
      expect(wrapper.find(Loader).exists()).toBe(true)
      await Promise.all([networkStore.loadOrganization, networkStore.loadPlans])
      expect(networkStore.loadOrganization).toHaveBeenCalledWith(
        apiStore.currentUserOrganizationId
      )
      expect(networkStore.loadPlans).toHaveBeenCalledWith(
        apiStore.currentUserOrganizationId
      )
      wrapper.update()
      expectTreeToMatchSnapshot(wrapper)
    })
  })

  describe('trial expired', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.is_within_trial_period = false
      apiStore.currentUserOrganization.active_users_count = 20
    })

    it('renders without trial information', async () => {
      const wrapper = shallow(
        <BillingInformation.wrappedComponent
          apiStore={apiStore}
          networkStore={networkStore}
        />
      )
      expect(wrapper.find(Loader).exists()).toBe(true)
      await Promise.all([networkStore.loadOrganization, networkStore.loadPlans])
      expect(networkStore.loadOrganization).toHaveBeenCalledWith(
        apiStore.currentUserOrganizationId
      )
      expect(networkStore.loadPlans).toHaveBeenCalledWith(
        apiStore.currentUserOrganizationId
      )
      wrapper.update()
      expectTreeToMatchSnapshot(wrapper)
    })
  })

  describe('within trial, exceeded trial users', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.is_within_trial_period = true
      apiStore.currentUserOrganization.trial_users_count = 5
      apiStore.currentUserOrganization.active_users_count = 100
    })

    it('renders with trial and billing information', async () => {
      const wrapper = shallow(
        <BillingInformation.wrappedComponent
          apiStore={apiStore}
          networkStore={networkStore}
        />
      )
      expect(wrapper.find(Loader).exists()).toBe(true)
      await Promise.all([networkStore.loadOrganization, networkStore.loadPlans])
      expect(networkStore.loadOrganization).toHaveBeenCalledWith(
        apiStore.currentUserOrganizationId
      )
      expect(networkStore.loadPlans).toHaveBeenCalledWith(
        apiStore.currentUserOrganizationId
      )
      wrapper.update()
      expectTreeToMatchSnapshot(wrapper)
    })
  })
})
