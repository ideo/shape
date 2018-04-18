import OrganizationDropdown from '~/ui/organizations/OrganizationDropdown'

import {
  fakeOrganization,
} from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'

describe('OrganizationDropdown', () => {
  let component, wrapper, props

  beforeEach(() => {
    const apiStore = fakeApiStore()
    apiStore.currentUser.current_organzation = fakeOrganization
    apiStore.currentUser.organizations = [
      fakeOrganization,
    ]
    props = {
      open: true,
      onItemClick: jest.fn(),
      apiStore,
    }
    wrapper = shallow(
      <OrganizationDropdown.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('closeOrgMenu', () => {
    beforeEach(() => {
      component.closeOrgMenu()
    })

    it('sets organization page to null', () => {
      expect(component.organizationPage).toBeFalsy()
    })
  })

  describe('openOrgMenu', () => {
    beforeEach(() => {
      component.openOrgMenu('organizationPeople')
    })

    it('sets organization page to passed in page name', () => {
      expect(component.organizationPage).toEqual('organizationPeople')
    })
  })

  describe('menuItems', () => {
    it('should add organizations to the list of items', () => {
      expect(component.menuItems[1].name).toEqual(fakeOrganization.name)
      expect(component.menuItems[1].iconLeft).toBeTruthy()
    })
  })
})
