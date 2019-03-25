import Header from '~/ui/layout/Header'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'

import { fakeCollection, fakeGroup, fakeTextItem } from '#/mocks/data'

const group = fakeGroup

let wrapper, props

describe('Header', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
      routingStore: fakeRoutingStore,
      uiStore: fakeUiStore,
    }
    props.apiStore.currentUser.current_organization.primary_group = group
    render = () => (wrapper = shallow(<Header.wrappedComponent {...props} />))
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

  describe('with a collection', () => {
    beforeEach(() => {
      fakeCollection.isNormalCollection = true
      fakeCollection.breadcrumb = [{ id: 12 }]
      props.uiStore.viewingCollection = fakeCollection
      // TODO: how do I properly reset this state? uiStore.viewingCollection persists outside this block
      render()
    })

    it('should render the breadcrumb', () => {
      expect(wrapper.find('Breadcrumb').prop('record')).toEqual(fakeCollection)
    })

    describe('on the homepage', () => {
      beforeEach(() => {
        // TODO: how do I properly reset this state?
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
      // TODO: how do I properly reset this state? uiStore.viewingItem persists outside this block
      render()
    })

    it('should render the breadcrumb', () => {
      expect(wrapper.find('Breadcrumb').prop('record')).toEqual(fakeTextItem)
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
    let settings, logout

    // TODO: I don't know why this suite can't find the dropdown.
    beforeEach(() => {
      wrapper
        .find('.userBtn')
        .first()
        .simulate('click')
      const menuProps = wrapper
        .find('.userDropdown')
        .find('MainMenuDropdown')
        .props()
      settings = menuProps.menuItems.find(
        item => item.name === 'Account Settings'
      )
      logout = menuProps.menuItems.find(item => item.name === 'Logout')
    })

    it('renders the user menu', () => {
      const MainMenuDropdown = wrapper
        .find('.userDropdown')
        .find('MainMenuDropdown')
      expect(MainMenuDropdown.props().menuOpen).toBe(true)
      expect(MainMenuDropdown.exists()).toBe(true)
    })

    it('has user settings option', () => {
      expect(settings).toBeDefined()
      expect(settings.onClick).toBeInstanceOf(Function)
    })

    it('has logout option', () => {
      expect(logout).toBeDefined()
      expect(logout.onClick).toBeInstanceOf(Function)
    })
  })
})
