import OrganizationSettings from '~/ui/organizations/OrganizationSettings'
import fakeApiStore from '#/mocks/fakeApiStore'
import { LabelContainer } from '~/ui/global/styled/forms'
import TextEditor from '~/ui/global/TextEditor'

let wrapper, component, apiStore, routingStore, props, organization

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
      component = wrapper.instance()
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

    it('reloads org groups after saving the domain whitelist', () => {
      component.afterDomainWhitelistUpdate()
      expect(props.apiStore.loadCurrentUserGroups).toHaveBeenCalledWith({
        orgOnly: true,
      })
    })

    it('should render a checkbox to add custom terms', () => {
      expect(wrapper.find(LabelContainer).exists()).toBe(true)
    })
  })

  describe('with custom terms checkbox checked', () => {
    beforeEach(() => {
      organization.terms_text_item = { id: 3 }
      wrapper = shallow(<OrganizationSettings.wrappedComponent {...props} />)
    })

    it('should render a text editor to enter the terms', () => {
      expect(wrapper.find(TextEditor).exists()).toBe(true)
    })
  })
})
