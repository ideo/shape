import SettingsPage from '~/ui/pages/SettingsPage'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, component, apiStore, routingStore, props, organization

beforeEach(() => {
  apiStore = fakeApiStore()
  routingStore = { routeTo: jest.fn() }
  organization = apiStore.currentUserOrganization
  props = { apiStore, routingStore }
})

describe('SettingsPage', () => {
  describe('without edit capabilities', () => {
    beforeEach(() => {
      organization.primary_group.can_edit = false
      wrapper = shallow(
        <SettingsPage.wrappedComponent {...props} />
      )
    })

    it('kicks you out back to the homepage', () => {
      expect(routingStore.routeTo).toBeCalledWith('/')
    })
  })

  describe('with edit capabilities', () => {
    beforeEach(() => {
      organization.primary_group.can_edit = true
      wrapper = shallow(
        <SettingsPage.wrappedComponent {...props} />
      )
      component = wrapper.instance()
    })

    it('renders the page with TagEditor for domain whitelist', () => {
      expect(wrapper.find('SimpleHeading1').exists()).toBeTruthy()
      expect(wrapper.find('TagEditor').props().record).toEqual(organization)
      expect(wrapper.find('TagEditor').props().tagField).toEqual('domain_whitelist')
    })

    it('reloads org groups after saving the domain whitelist', () => {
      component.afterDomainWhitelistUpdate()
      expect(props.apiStore.loadCurrentUserGroups).toHaveBeenCalledWith({
        orgOnly: true
      })
    })
  })
})
