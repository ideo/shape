import MainMenuDropdown from '~/ui/global/MainMenuDropdown'
import { fakeOrganization } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

describe('MainMenuDropdown', () => {
  let component, wrapper, props, otherFakeOrg, itemNames

  beforeEach(() => {
    const apiStore = fakeApiStore()
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
    }
    otherFakeOrg = Object.assign({}, fakeOrganization, { id: 999, name: 'new' })
    apiStore.currentUser.current_organization = fakeOrganization
    fakeOrganization.primary_group.can_edit = true
    apiStore.currentUser.organizations = [fakeOrganization, otherFakeOrg]
    props = {
      open: true,
      onItemClick: jest.fn(),
      apiStore,
      routingStore,
      uiStore: fakeUiStore,
    }
    itemNames = [
      'People & Groups',
      'New Organization',
      'Settings',
      'Contact Support',
      'Billing',
      'Legal',
    ]
    wrapper = shallow(<MainMenuDropdown.wrappedComponent {...props} />)
    component = wrapper.instance()
    props.uiStore.alert.mockClear()
    props.uiStore.confirm.mockClear()
  })

  describe('menuItems', () => {
    it('should add organizations to the list of items', () => {
      expect(component.menuItems.organizations[0].name).toEqual(
        otherFakeOrg.primary_group.name
      )
      expect(component.menuItems.organizations[0].iconLeft).toBeTruthy()
    })

    it('should not add your current organization to list of items', () => {
      expect(
        component.menuItems.organizations.indexOf(
          otherFakeOrg.primary_group.name
        )
      ).toEqual(-1)
    })

    it('should have all other menu items', () => {
      const items = component.menuItems.top.concat(component.menuItems.bottom)
      expect(items.map(i => i.name)).toEqual(itemNames)
    })

    describe('if current user is not an org admin', () => {
      beforeEach(() => {
        fakeOrganization.primary_group.can_edit = false
      })

      it('should not show the settings link', () => {
        expect(
          component.menuItems.bottom.find(item => item.name === 'Settings')
        ).toBeFalsy()
      })

      it('should not show the billing link', () => {
        expect(
          component.menuItems.bottom.find(item => item.name === 'Billing')
        ).toBeFalsy()
      })
    })
  })

  describe('openOrgMenu', () => {
    beforeEach(() => {
      component.handleOrgPeople()
    })

    it('sets organization page to passed in page name', () => {
      expect(props.uiStore.update).toHaveBeenCalledWith(
        'organizationMenuPage',
        'organizationPeople'
      )
    })
  })

  describe('handleSwitchOrg', () => {
    const orgId = 1
    const fakeEv = { preventDefault: () => null }

    it('should call switchOrganization on currentUser', () => {
      component.handleSwitchOrg(orgId)(fakeEv)
      expect(
        props.apiStore.currentUser.switchOrganization
      ).toHaveBeenCalledWith(orgId, { redirectPath: 'homepage' })
    })

    it('should call uiStore.confirm if trying to move cards between orgs', () => {
      props.uiStore.isMovingCards = true
      wrapper.setProps(props)
      component.handleSwitchOrg(orgId)(fakeEv)
      // findOrganizationById to lookup the name for the confirm dialog
      expect(props.apiStore.findOrganizationById).toHaveBeenCalledWith(orgId)
      expect(props.uiStore.confirm).toHaveBeenCalled()
    })
  })

  describe('handleZendesk', () => {
    const zEBackup = global.zE
    beforeEach(() => {
      global.zE = { activate: jest.fn() }
      component.handleZendesk()
    })

    it('should activate the Zendesk widget', () => {
      expect(global.zE.activate).toHaveBeenCalledWith({ hideOnClose: true })
    })

    afterEach(() => {
      global.zE = zEBackup
    })
  })

  describe('handleBilling', () => {
    beforeEach(() => {
      component.handleBilling()
    })

    it('should route to the billing page', () => {
      expect(props.routingStore.routeTo).toHaveBeenCalledWith('/billing')
    })
  })

  describe('handleLegal', () => {
    beforeEach(() => {
      component.handleLegal()
    })

    it('should route to the terms page', () => {
      expect(props.routingStore.routeTo).toHaveBeenCalledWith('/terms')
    })
  })
})
