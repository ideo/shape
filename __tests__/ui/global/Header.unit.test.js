import Header from '~/ui/layout/Header'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'

import { fakeCollection, fakeGroup, fakeTextItem } from '#/mocks/data'

const group = fakeGroup

let wrapper, component, props

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

  it('renders the org avatar', () => {
    const orgAvatar = wrapper.find('.organization-avatar')
    expect(orgAvatar.exists()).toBe(true)
    expect(orgAvatar.props().title).toEqual(group.name)
    expect(orgAvatar.props().url).toEqual(group.filestack_file_url)
  })

  it('renders the user avatar', () => {
    const userAvatar = wrapper.find('.user-avatar')
    const { currentUser } = props.apiStore
    expect(userAvatar.exists()).toBe(true)
    expect(userAvatar.props().title).toEqual(currentUser.name)
    expect(userAvatar.props().url).toEqual(currentUser.pic_url_square)
  })

  it('does not show the user menu', () => {
    expect(wrapper.find('PopoutMenu').exists()).toBe(false)
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
      props.uiStore.viewingCollection = fakeCollection
      render()
    })

    it('should render the breadcrumb', () => {
      expect(wrapper.find('Breadcrumb').prop('record')).toEqual(fakeCollection)
    })

    describe('on the homepage', () => {
      beforeEach(() => {
        props.routingStore.isHomepage = true
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
      props.uiStore.viewingItem = fakeTextItem
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
  })

  describe('with no current_organization', () => {
    beforeEach(() => {
      props.apiStore.currentUser.current_organization = null
      wrapper = shallow(<Header.wrappedComponent {...props} />)
    })

    it('renders the BasicHeader', () => {
      expect(wrapper.find('BasicHeader').exists()).toBe(true)
    })
  })

  describe('when clicking on user', () => {
    beforeEach(() => {
      wrapper
        .find('.userBtn')
        .first()
        .simulate('click')
    })

    it('renders the user menu', () => {
      const MainMenuDropdown = wrapper
        .find('.userDropdown')
        .find('MainMenuDropdown')
      expect(MainMenuDropdown.props().open).toBe(true)
      expect(MainMenuDropdown.exists()).toBe(true)
    })
  })
})
