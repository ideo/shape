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
        name: 'Space',
        pic_url_square: 'test.jpg',
      }
    }
    wrapper = mount(
      <OrganizationAvatar {...props} />
    )
  })

  it('renders the url if filestack_file_url exists', () => {
    props.organization.filestack_file_url = 'testfile.jpg'
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
