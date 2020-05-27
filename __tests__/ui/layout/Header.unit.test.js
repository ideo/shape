import Header from '~/ui/layout/Header'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'

import { fakeCollection, fakeGroup, fakeTextItem, fakeRole } from '#/mocks/data'

const group = fakeGroup

let wrapper, component, props, instance

describe('Header', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
      routingStore: fakeRoutingStore,
      uiStore: { ...fakeUiStore },
    }
    props.apiStore.currentUser.current_organization.primary_group = group
    render = () => {
      wrapper = shallow(<Header.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  it('renders the logo', () => {
    expect(wrapper.find('Logo').exists()).toBe(true)
  })

  it('renders the search bar', () => {
    expect(wrapper.find('.search-bar').exists()).toBe(true)
  })

  describe('closeOrgMenu', () => {
    beforeEach(() => {
      component.closeOrgMenu()
    })

    it('sets organization page to null', () => {
      expect(component.organizationPage).toBeFalsy()
    })
  })

  describe('with a collection', () => {
    beforeEach(() => {
      fakeCollection.isNormalCollection = true
      fakeCollection.breadcrumb = [{ id: 12 }]
      props.uiStore.viewingRecord = fakeCollection
      render()
    })

    it('should render the breadcrumb', () => {
      expect(wrapper.find('Breadcrumb').prop('record')).toEqual(fakeCollection)
    })

    describe('on the homepage', () => {
      beforeEach(() => {
        props.uiStore.isViewingHomepage = true
        render()
      })

      it('should not render the breadcrumb', () => {
        expect(wrapper.find('Breadcrumb').prop('isHomepage')).toBeTruthy()
      })
    })
  })

  describe('with an editable item', () => {
    beforeEach(() => {
      fakeTextItem.can_edit = true
      fakeTextItem.collaborators = [{ id: 1, avatar: 'x' }]
      props.uiStore.viewingRecord = fakeTextItem
      render()
    })

    it('should render the breadcrumb', () => {
      expect(wrapper.find('Breadcrumb').prop('record')).toEqual(fakeTextItem)
    })

    it('should render the roles', () => {
      expect(wrapper.find('RolesSummary').exists()).toBeTruthy()
    })

    it('should render the activity log icon', () => {
      expect(wrapper.find('ActivityLogButton').exists()).toBeTruthy()
    })

    it('should render the page menu', () => {
      expect(wrapper.find('ActionMenu').exists()).toBeTruthy()
    })

    it('passes canEdit through to RolesSummary', () => {
      expect(wrapper.find('RolesSummary').props().canEdit).toEqual(
        component.record.can_edit
      )
    })

    it('passes collaborators through to RolesSummary', () => {
      expect(wrapper.find('RolesSummary').props().collaborators).toEqual(
        fakeTextItem.collaborators
      )
    })

    describe('showObjectRoleDialog', () => {
      beforeEach(() => {
        props.uiStore.update.mockClear()
        props.uiStore.rolesMenuOpen = null
        component.showObjectRoleDialog()
      })

      it('should open the roles menu in the ui store', () => {
        expect(props.uiStore.update).toHaveBeenCalledWith(
          'rolesMenuOpen',
          component.record
        )
      })
    })

    describe('with a parent collection that you have access to', () => {
      beforeEach(() => {
        props.uiStore.update.mockClear()
        props.uiStore.pageMenuOpen = null
        component.record.parent_collection_card = {}
        component.record.parent_collection_card.can_edit_parent = true
        component.record.parent_collection_card.parent_id = 1
        component.routeBack()
      })

      it('should route user back to the parent collection', () => {
        expect(props.routingStore.routeTo).toHaveBeenCalledWith(
          'collections',
          1
        )
      })
    })
  })

  describe('with no current_organization', () => {
    beforeEach(() => {
      props.apiStore.currentUserOrganization = null
      wrapper = shallow(<Header.wrappedComponent {...props} />)
    })

    it('renders the BasicHeader', () => {
      expect(wrapper.find('BasicHeader').exists()).toBe(true)
    })
  })

  describe('getUsersAndGroupsLength', () => {
    beforeEach(() => {
      fakeCollection.roles = [fakeRole]
      props.uiStore.viewingRecord = fakeCollection
      wrapper = shallow(<Header.wrappedComponent {...props} />)
      instance = wrapper.instance()
    })

    it('should return the total amount of groups and users per role', () => {
      expect(instance.getUsersAndGroupsLength()).toEqual(
        fakeRole.users.length + fakeRole.groups.length
      )
    })
  })
})
