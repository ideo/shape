import OrganizationDropdown from '~/ui/organizations/OrganizationDropdown'

import {
  fakeOrganization,
} from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

describe('OrganizationDropdown', () => {
  let component, wrapper, props, otherFakeOrg

  beforeEach(() => {
    const apiStore = fakeApiStore()
    otherFakeOrg = Object.assign({}, fakeOrganization, { id: 999, name: 'new' })
    apiStore.currentUser.current_organization = fakeOrganization
    fakeOrganization.primary_group.currentUserCanEdit = true
    apiStore.currentUser.organizations = [
      fakeOrganization,
      otherFakeOrg,
    ]
    props = {
      open: true,
      onItemClick: jest.fn(),
      apiStore,
      uiStore: fakeUiStore,
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
      expect(props.uiStore.update).toHaveBeenCalledWith('organizationMenuPage', 'organizationPeople')
    })
  })

  describe('menuItems', () => {
    it('should add organizations to the list of items', () => {
      expect(component.menuItems[1].name).toEqual(otherFakeOrg.name)
      expect(component.menuItems[1].iconLeft).toBeTruthy()
    })

    it('should not add your current organization to list of items', () => {
      expect(component.menuItems.length).toEqual(4)
    })

    describe('if current user is not an org admin', () => {
      beforeEach(() => {
        fakeOrganization.primary_group.currentUserCanEdit = false
      })

      it('should not show the settings link', () => {
        expect(component.menuItems.length).toEqual(3)
      })
    })
  })
})
