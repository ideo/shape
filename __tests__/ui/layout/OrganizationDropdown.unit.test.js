import OrganizationDropdown from '~/ui/layout/OrganizationDropdown'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper
const apiStore = {
  currentUserOrganization: {
    name: 'foo',
    filestack_file_url: 'http://file.com/123',
    primary_group: {},
  },
}
const props = {
  apiStore,
  uiStore: fakeUiStore,
}
const render = () =>
  shallow(<OrganizationDropdown.wrappedComponent {...props} />)

describe('OrganizationDropdown', () => {
  beforeEach(() => {
    wrapper = render()
  })

  it('renders an AvatarDropdown', () => {
    expect(wrapper.find('AvatarDropdown').exists()).toBe(true)
  })

  it('renders the currentUserOrganization avatar', () => {
    const { avatar } = wrapper.instance()
    const org = apiStore.currentUserOrganization
    expect(avatar.title).toEqual(org.name)
    expect(avatar.url).toEqual(org.filestack_file_url)
  })

  describe('when viewing an anyone_can_view collection', () => {
    beforeEach(() => {
      props.uiStore.viewingRecord = {
        organization: {
          name: 'bar',
          filestack_file_url: 'http://bar.com/199',
        },
        anyone_can_view: true,
      }
      wrapper = render()
    })

    it('renders the currentUserOrganization avatar', () => {
      const { avatar } = wrapper.instance()
      expect(avatar.title).toEqual('bar')
      expect(avatar.url).toEqual('http://bar.com/199')
    })
  })
})
