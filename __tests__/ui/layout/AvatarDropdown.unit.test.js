import AvatarDropdown from '~/ui/layout/AvatarDropdown'

describe('AvatarDropdown', () => {
  let props, wrapper

  const render = () => {
    wrapper = shallow(<AvatarDropdown {...props} />)
  }

  beforeEach(() => {
    wrapper = undefined
    props = {
      renderAvatar: jest.fn(() => <div id="test-avatar" />),
      renderDropdown: jest.fn(() => <div id="test-dropdown" />),
      className: 'userDropdown',
    }
  })

  it(`does not render the dropdown when mounted`, () => {
    render()

    expect(props.renderDropdown).not.toHaveBeenCalled()
    expect(wrapper.find('#test-avatar').exists()).toBe(true)
    expect(wrapper.find('#test-dropdown').exists()).toBe(false)
    expect(wrapper.find('ClickWrapper').exists()).toBe(false)
  })

  it('opens and closes the dropdown menu', () => {
    render()
    wrapper.instance().openDropdown()
    wrapper.update()

    expect(props.renderDropdown).toHaveBeenCalled()
    expect(wrapper.find('#test-dropdown').exists()).toBe(true)
    expect(wrapper.find('ClickWrapper').exists()).toBe(true)

    wrapper.instance().closeDropdown()
    wrapper.update()

    expect(props.renderDropdown).not.toHaveBeenCalledTimes(2)
    expect(wrapper.find('#test-dropdown').exists()).toBe(false)
    expect(wrapper.find('ClickWrapper').exists()).toBe(false)
  })
})
