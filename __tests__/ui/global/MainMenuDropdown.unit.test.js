import MainMenuDropdown, {
  CONTEXT_USER,
  CONTEXT_ORG,
} from '~/ui/global/MainMenuDropdown'
import { fakeOrganization } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'

describe('MainMenuDropdown', () => {
  let component, wrapper, props, otherFakeOrg, itemNames

  beforeEach(() => {
    const apiStore = fakeApiStore()
    otherFakeOrg = {
      ...fakeOrganization,
      id: 999,
      name: 'new',
      primary_group: { name: 'new' },
    }
    apiStore.currentUserOrganization = fakeOrganization
    fakeOrganization.primary_group.can_edit = true
    apiStore.currentUser.organizations = [fakeOrganization, otherFakeOrg]
    props = {
      open: true,
      onItemClick: jest.fn(),
      apiStore,
      routingStore: fakeRoutingStore,
      uiStore: fakeUiStore,
      showCurrentOrg: false,
    }
    itemNames = [
      'People & Groups',
      'New Organization',
      'Settings',
      'Contact Support',
      'Billing',
      'IDEO Products Terms',
      'Privacy Policy',
    ]
    props.uiStore.alert.mockClear()
    props.uiStore.confirm.mockClear()
    render = () => {
      wrapper = shallow(<MainMenuDropdown.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  describe('menuItems', () => {
    it('should add organizations to the list of items', () => {
      expect(component.menuItems.organizations[0].name).toEqual(
        otherFakeOrg.primary_group.name
      )
      expect(component.menuItems.organizations[0].iconLeft).toBeTruthy()
    })

    it('should not add your current organization to list of items', () => {
      const orgNames = component.menuItems.organizations.map(o => o.name)
      expect(orgNames.indexOf(fakeOrganization.primary_group.name)).toEqual(-1)
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

    describe('if displaying the user menu', () => {
      beforeEach(() => {
        props.context = CONTEXT_USER
        render()
      })

      it('has a main group', () => {
        expect(component.menuItems.main).toBeDefined()
      })

      it('does not have a top group', () => {
        expect(component.menuItems.top).toBeUndefined()
      })

      it('has user settings option', () => {
        const link = component.menuItems.main.find(
          item => item.name === 'Account Settings'
        )
        expect(link).toBeDefined()
        expect(link.onClick).toBeInstanceOf(Function)
      })

      it('has notifications option', () => {
        const link = component.menuItems.main.find(
          item => item.name === 'Notification Settings'
        )
        expect(link).toBeDefined()
        expect(link.onClick).toBeInstanceOf(Function)
      })

      it('has logout option', () => {
        const link = component.menuItems.main.find(
          item => item.name === 'Logout'
        )
        expect(link).toBeDefined()
        expect(link.onClick).toBeInstanceOf(Function)
      })
    })

    describe('if displaying the org menu', () => {
      beforeEach(() => {
        props.context = CONTEXT_ORG
        render()
      })

      it('has the correct groups', () => {
        expect(component.menuItems.top).toBeDefined()
        expect(component.menuItems.organizations).toBeDefined()
        expect(component.menuItems.bottom).toBeDefined()
      })

      it('does not have a main group', () => {
        expect(component.menuItems.main).toBeUndefined()
      })

      it('has a People & Groups option', () => {
        const link = component.menuItems.top.find(
          item => item.name === 'People & Groups'
        )
        expect(link).toBeDefined()
        expect(link.onClick).toBeInstanceOf(Function)
      })

      it('has a New Organization option', () => {
        const link = component.menuItems.bottom.find(
          item => item.name === 'New Organization'
        )
        expect(link).toBeDefined()
        expect(link.onClick).toBeInstanceOf(Function)
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
    const fakeEv = { preventDefault: () => null }

    it('should route you to the organization', () => {
      component.handleSwitchOrg(fakeOrganization)(fakeEv)
      expect(fakeRoutingStore.routeTo).toHaveBeenCalledWith(
        `/${fakeOrganization.slug}`
      )
    })

    it('should call uiStore.confirm if trying to move cards between orgs', () => {
      props.uiStore.isMovingCards = true
      wrapper.setProps(props)
      component.handleSwitchOrg(fakeOrganization)(fakeEv)
      // findOrganizationById to lookup the name for the confirm dialog
      expect(props.apiStore.findOrganizationById).toHaveBeenCalledWith(
        fakeOrganization.id
      )
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

  describe('handleTerms', () => {
    beforeEach(() => {
      component.handleTerms()
    })

    it('should route to the terms page', () => {
      expect(props.routingStore.routeTo).toHaveBeenCalledWith('/terms')
    })
  })

  describe('with showCurrentOrg = true', () => {
    beforeEach(() => {
      props.showCurrentOrg = true
      render()
    })

    it('should still show the current organization in the dropdown', () => {
      const orgNames = component.menuItems.organizations.map(o => o.name)
      expect(orgNames.indexOf(fakeOrganization.primary_group.name)).not.toEqual(
        -1
      )
    })
  })
})
