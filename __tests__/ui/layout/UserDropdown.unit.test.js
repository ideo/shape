import UserDropdown from '~/ui/layout/UserDropdown'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

describe('UserDropdown', () => {
  let apiStore, props, wrapper

  const render = () => {
    wrapper = shallow(<UserDropdown.wrappedComponent {...props} />)
  }

  beforeEach(() => {
    wrapper = undefined
    apiStore = fakeApiStore()
    props = {
      apiStore,
      uiStore: { ...fakeUiStore },
    }
  })

  it(`renders the current user's avatar`, () => {
    render()

    const { currentUser } = apiStore
    const userAvatar = wrapper.find('.user-avatar').first()
    expect(userAvatar.exists()).toBe(true)
    expect(userAvatar.props().title).toEqual(currentUser.name)
    expect(userAvatar.props().url).toEqual(currentUser.pic_url_square)
  })

  it('does not show the menu before it is clicked', () => {
    render()
    expect(wrapper.find('MainMenuDropdown').exists()).toBe(false)
  })

  it('shows the user menu when clicked', () => {
    render()
    wrapper
      .find('.userBtn')
      .first()
      .simulate('click')

    const MainMenuDropdown = wrapper.find('MainMenuDropdown')
    expect(MainMenuDropdown.props().open).toBe(true)
    expect(MainMenuDropdown.exists()).toBe(true)
  })
})
