import OrganizationAvatar from '~/ui/organizations/OrganizationAvatar'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper
describe('OrganizationAvatar', () => {
  beforeEach(() => {
    props = {
      uiStore: fakeUiStore,
      organization: {
        name: 'Space',
        filestack_file_url: 'test.jpg',
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
    expect(wrapper.find('Avatar').first().props().url).toEqual('testfile.jpg')
  })

  it('should open the organization menu in the ui store on click', () => {
    wrapper.find('Avatar').at(0).simulate('click')
    expect(props.uiStore.update).toHaveBeenCalledWith('organizationMenuOpen', true)
  })
})
