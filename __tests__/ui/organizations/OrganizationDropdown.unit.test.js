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
    const history = { push: jest.fn() }
    props = {
      open: true,
      onItemClick: jest.fn(),
      apiStore,
      history,
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

  describe('handleLegal', () => {
    beforeEach(() => {
      component.handleLegal()
    })

    it('should call the on item click handler', () => {
      expect(props.onItemClick).toHaveBeenCalled()
    })

    it('should push a terms path to router history', () => {
      expect(props.history.push).toHaveBeenCalled()
    })
  })
})
