import PopoutMenu from '~/ui/global/PopoutMenu'

const props = {
  onMouseLeave: jest.fn(),
  onClick: jest.fn(),
  className: '',
  menuItems: [
    { name: 'Do Stuff', iconRight: <div className="icon" />, onClick: jest.fn() }
  ],
  menuOpen: false,
}

let wrapper
describe('PopoutMenu', () => {
  beforeEach(() => {
    wrapper = shallow(
      <PopoutMenu {...props} />
    )
  })

  it('renders a toggle button', () => {
    expect(wrapper.find('StyledMenuToggle').exists()).toBe(true)
  })

  it('renders menu', () => {
    expect(wrapper.find('StyledMenuWrapper').exists()).toBe(true)
  })

  it('renders all menu items', () => {
    expect(wrapper.find('StyledMenuItem').length).toEqual(props.menuItems.length)
  })

  it('makes the menu items clickable', () => {
    wrapper.find('StyledMenuItem').at(0).find('button').simulate('click')
    expect(props.menuItems[0].onClick).toHaveBeenCalled()
  })

  it('renders the right or left icon', () => {
    expect(wrapper.find('.icon').at(0).exists()).toBe(true)
  })

  it('has "open" CSS class if menu is open', () => {
    wrapper = shallow(
      <PopoutMenu {...props} menuOpen />
    )
    expect(wrapper.find('.open').exists()).toBe(true)
  })

  it('calls openCardMenu on uiStore on click', () => {
    wrapper.find('StyledMenuToggle').at(0).simulate('click')
    expect(props.onClick).toHaveBeenCalled()
  })
})
