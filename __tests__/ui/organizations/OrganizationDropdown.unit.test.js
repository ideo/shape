import OrganizationDropdown from '~/ui/organizations/OrganizationDropdown'

import {
  fakeOrganization,
} from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

describe('OrganizationDropdown', () => {
  let component, wrapper, props, otherFakeOrg, itemNames

  beforeEach(() => {
    const apiStore = fakeApiStore()
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
    }
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
      routingStore,
      uiStore: fakeUiStore,
    }
    itemNames = [
      'People & Groups',
      ...[otherFakeOrg.name],
      'New Organization',
      'Settings',
      'Legal'
    ]
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
      expect(component.menuItems.map(item => item.name)).toEqual(itemNames)
    })

    describe('if current user is not an org admin', () => {
      beforeEach(() => {
        fakeOrganization.primary_group.currentUserCanEdit = false
      })

      it('should not show the settings link', () => {
        expect(component.menuItems.find(
          item => item.name === 'Settings'
        )).toBeFalsy()
      })
    })
  })

  describe('handleLegal', () => {
    beforeEach(() => {
      component.handleLegal()
    })

    it('should call the on item click handler', () => {
      expect(props.onItemClick).toHaveBeenCalled()
    })

    it('should route to the terms page', () => {
      expect(props.routingStore.routeTo).toHaveBeenCalledWith('/terms')
    })
  })
})
