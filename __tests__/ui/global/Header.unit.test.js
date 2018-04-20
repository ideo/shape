import Header from '~/ui/layout/Header'

import fakeApiStore from '#/mocks/fakeApiStore'

import {
  fakeGroup
} from '#/mocks/data'

const group = fakeGroup

let wrapper, props

describe('Header', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore()
    }
    props.apiStore.currentUser.current_organization.primary_group = group
    wrapper = shallow(
      <Header.wrappedComponent {...props} />
    )
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

  describe('when clicking on user', () => {
    let settings, logout

    beforeEach(() => {
      wrapper.find('.userBtn').first().simulate('click')
      const menuProps = wrapper.find('PopoutMenu').props()
      settings = menuProps.menuItems.find(item => item.name === 'Account Settings')
      logout = menuProps.menuItems.find(item => item.name === 'Logout')
    })

    it('renders the user menu', () => {
      expect(wrapper.find('PopoutMenu').props().menuOpen).toBe(true)
      expect(wrapper.find('PopoutMenu').exists()).toBe(true)
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
