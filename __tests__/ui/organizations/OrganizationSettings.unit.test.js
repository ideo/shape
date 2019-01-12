import OrganizationSettings from '~/ui/organizations/OrganizationSettings'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, apiStore, routingStore, props, organization

beforeEach(() => {
  apiStore = fakeApiStore()
  routingStore = { routeTo: jest.fn() }
  organization = apiStore.currentUserOrganization
  props = { apiStore, routingStore }
})

describe('OrganizationSettings', () => {
  describe('without edit capabilities', () => {
    beforeEach(() => {
      organization.primary_group.can_edit = false
      wrapper = shallow(<OrganizationSettings.wrappedComponent {...props} />)
    })

    it('kicks you out back to the homepage', () => {
      expect(routingStore.routeTo).toBeCalledWith('homepage')
    })
  })

  describe('with edit capabilities', () => {
    beforeEach(() => {
      organization.primary_group.can_edit = true
      wrapper = shallow(<OrganizationSettings.wrappedComponent {...props} />)
    })

    it('renders the page with TagEditor for domain whitelist', () => {
      expect(wrapper.find('TagEditor').props().record).toEqual(organization)
      expect(wrapper.find('TagEditor').props().tagField).toEqual(
        'domain_whitelist'
      )
    })
  })
})
