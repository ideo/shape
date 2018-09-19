import PopoutMenu from '~/ui/global/PopoutMenu'

const fakeMenuItems = [
  { name: 'Do Stuff', iconRight: <div className="icon" />, onClick: jest.fn() },
  {
    name: 'Do Stuff',
    iconLeft: <div className="icon" />,
    onClick: jest.fn(),
    noBorder: true,
  },
]
const props = {
  onMouseLeave: jest.fn(),
  onClick: jest.fn(),
  className: '',
  menuOpen: false,
  noBorder: true,
}

let wrapper
describe('PopoutMenu', () => {
  let menuItem

  describe('with menuItems', () => {
    beforeEach(() => {
      props.menuItems = [...fakeMenuItems]
      props.menuItems.forEach(item => item.onClick.mockClear())
      wrapper = shallow(<PopoutMenu {...props} />)
      menuItem = wrapper.find('StyledMenuItem')
    })

    it('renders a toggle button', () => {
      expect(wrapper.find('StyledMenuToggle').exists()).toBe(true)
    })

    it('renders menu', () => {
      expect(wrapper.find('StyledMenuWrapper').exists()).toBe(true)
    })

    it('renders all menu items', () => {
      expect(menuItem.length).toEqual(props.menuItems.length)
    })

    it('makes the menu items clickable', () => {
      menuItem
        .at(0)
        .find('button')
        .simulate('click')
      expect(props.menuItems[0].onClick).toHaveBeenCalled()
    })

    it('renders the right or left icon', () => {
      expect(
        wrapper
          .find('.icon')
          .at(0)
          .exists()
      ).toBe(true)
    })

    it('will render a border when noBorder set to true', () => {
      expect(menuItem.at(0)).toHaveStyleRule('border-bottom-width', '1px', {
        modifier: 'button',
      })
    })

    it('has "open" CSS class if menu is open', () => {
      wrapper = shallow(<PopoutMenu {...props} menuOpen />)
      expect(wrapper.find('.open').exists()).toBe(true)
    })

    it('calls openCardMenu on uiStore on click', () => {
      wrapper
        .find('StyledMenuToggle')
        .at(0)
        .simulate('click')
      expect(props.onClick).toHaveBeenCalled()
    })

    describe('on a menu item with no border', () => {
      it('will not render a border', () => {
        expect(menuItem.at(1)).toHaveStyleRule('border-bottom-width', '0px', {
          modifier: 'button',
        })
      })
    })
  })

  describe('with groupedMenuItems', () => {
    beforeEach(() => {
      props.groupedMenuItems = {
        top: [...fakeMenuItems],
        bottom: [...fakeMenuItems],
      }
      props.groupedMenuItems.top.forEach(item => item.onClick.mockClear())
      props.groupedMenuItems.bottom.forEach(item => item.onClick.mockClear())
      wrapper = shallow(<PopoutMenu {...props} />)
      menuItem = wrapper.find('StyledMenuItem')
    })

    it('renders all menu items', () => {
      const { groupedMenuItems } = props
      expect(menuItem.length).toEqual(
        groupedMenuItems.top.length + groupedMenuItems.bottom.length
      )
    })

    it('makes the menu items clickable', () => {
      menuItem
        .at(0)
        .find('button')
        .simulate('click')
      expect(props.groupedMenuItems.top[0].onClick).toHaveBeenCalled()
    })
  })
})
