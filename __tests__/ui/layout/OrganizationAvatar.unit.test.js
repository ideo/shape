import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'


let props
let wrapper

describe('OrganizationAvatar', () => {
  beforeEach(() => {
    props = {
      uiStore: {
        organizationMenuOpen: false,
        openOrganizationMenu: jest.fn()
      },
      organization: {
        name: 'Space'
      }
    }
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

  it('renders the url if pic_url_square exists', () => {
    props.organization.pic_url_square = 'testfile.jpg'
    wrapper = mount(
      <OrganizationAvatar {...props} />
    )
    expect(wrapper.find('Avatar').props().src).toEqual('testfile.jpg')
  })

  it('should open the organization menu in the ui store on click', () => {
    wrapper.find('Avatar').at(0).simulate('click')
    expect(props.uiStore.openOrganizationMenu).toHaveBeenCalled()
  })
})
