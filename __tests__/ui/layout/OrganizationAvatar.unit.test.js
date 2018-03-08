import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'

const props = {
  uiStore: {
    organizationMenuOpen: false,
    openOrganizationMenu: jest.fn()
  },
  organization: {
    name: 'Space'
  }
}

let wrapper

describe('OrganizationAvatar', () => {
  beforeEach(() => {
    wrapper = mount(
      <OrganizationAvatar {...props} />
    )
  })

  it('renders a default icon image', () => {
    const avatar = wrapper.find('Avatar')
    expect(avatar).toHaveLength(1)
    expect(avatar.props().src).toEqual(
      'https://d3none3dlnlrde.cloudfront.net/assets/users/avatars/missing/square.jpg'
    )
  })

  it('should open the organization menu in the ui store on click', () => {
    wrapper.find('Avatar').at(0).simulate('click')
    expect(props.uiStore.openOrganizationMenu).toHaveBeenCalled()
  })
})
