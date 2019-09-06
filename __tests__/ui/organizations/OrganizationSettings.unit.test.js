import OrganizationSettings from '~/ui/organizations/OrganizationSettings'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { FormButton } from '~/ui/global/styled/buttons'
import { LabelContainer } from '~/ui/global/styled/forms'
import TextEditor from '~/ui/global/TextEditor'

let wrapper, apiStore, routingStore, uiStore, props, organization, component

beforeEach(() => {
  apiStore = fakeApiStore()
  uiStore = fakeUiStore
  routingStore = { routeTo: jest.fn() }
  organization = apiStore.currentUserOrganization
  props = { apiStore, routingStore, uiStore }
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

    it('should render a checkbox to add custom terms', () => {
      expect(wrapper.find(LabelContainer).exists()).toBe(true)
    })
  })

  describe('with custom terms checkbox checked', () => {
    beforeEach(() => {
      organization.terms_text_item = { id: 3, save: jest.fn() }
      organization.terms_version = null
      organization.API_bumpTermsVersion = jest.fn()
      wrapper = shallow(<OrganizationSettings.wrappedComponent {...props} />)
      component = wrapper.instance()
    })

    it('should render a text editor to enter the terms', () => {
      expect(wrapper.find(TextEditor).exists()).toBe(true)
    })

    it('should render the save button', () => {
      expect(wrapper.find(FormButton).exists()).toBe(true)
    })

    it('should track bumpTermsVersion', () => {
      // initialize to true if terms_version starts off null
      expect(component.bumpTermsVersion).toBe(true)
      component.handleTermsVersionChange()
      expect(component.bumpTermsVersion).toBe(false)
    })

    it('should save the item and org values', async () => {
      // set to false so we can call save without confirm
      component.bumpTermsVersion = false
      await component.handleSaveTerms({ preventDefault: jest.fn() })
      expect(organization.terms_text_item.save).toHaveBeenCalled()
      expect(organization.API_bumpTermsVersion).not.toHaveBeenCalled()
      expect(uiStore.popupSnackbar).toHaveBeenCalled()
    })

    it('should confirm changes if bumpTermsVersion is true', () => {
      // set to false so we can call save without confirm
      component.bumpTermsVersion = true
      component.handleSaveTerms({ preventDefault: jest.fn() })
      expect(uiStore.confirm).toHaveBeenCalled()
      expect(organization.terms_text_item.save).not.toHaveBeenCalled()
    })
  })
})
