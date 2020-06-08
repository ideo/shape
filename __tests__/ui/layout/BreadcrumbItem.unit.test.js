import { BreadcrumbItem } from '~/ui/layout/BreadcrumbItem'
import {
  StyledMenu,
  StyledMenuButton,
  StyledMenuItem,
  StyledMenuWrapper,
} from '~/ui/global/PopoutMenu'
import Tooltip from '~/ui/global/Tooltip'

jest.mock('../../../app/javascript/stores')
jest.useFakeTimers()

let wrapper, props, rerender

describe('BreadcrumbItem', () => {
  let breadcrumbItem

  beforeEach(() => {
    props = {
      item: {
        name: 'Home',
        id: '1',
        type: 'Collection',
        breadcrumbDropDownRecords: [],
      },
      index: 1,
      numItems: 1,
      restoreBreadcrumb: jest.fn(),
      onBreadcrumbDive: jest.fn(),
      onBreadcrumbClick: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<BreadcrumbItem {...props} />)
      breadcrumbItem = wrapper.find('StyledBreadcrumbItem').at(0)
    }
    rerender()
  })

  describe('render()', () => {
    it('renders StyledBreadcrumbItem wrapper', () => {
      expect(wrapper.find('StyledBreadcrumbItem').exists()).toBeTruthy()
    })

    describe('with background color', () => {
      beforeEach(() => {
        props.backgroundColor = 'blue'
        rerender()
      })

      it('should assign the background color on StyledBreadcrumbItem', () => {
        expect(breadcrumbItem.props().backgroundColor).toEqual('blue')
      })
    })

    describe('with dropdown open', () => {
      beforeEach(() => {
        wrapper.setState({
          dropdownOpen: true,
        })
        wrapper.instance().setInitialBaseRecords()
        wrapper.update()
      })

      it('should render a dropdown menu', () => {
        expect(wrapper.find(StyledMenu).exists()).toBeTruthy()
      })

      it('should render a menu item for the breadcrumb item', () => {
        expect(wrapper.find(StyledMenuItem).length).toEqual(1)
      })

      describe('if breadcrumb has children', () => {
        beforeEach(() => {
          const newProps = {
            item: { ...props.item, has_children: true },
          }
          wrapper.setProps(newProps)
          wrapper.instance().setInitialBaseRecords()
          wrapper.update()
        })

        it('should render a Dive Button', () => {
          const menuItem = wrapper.find(StyledMenuItem)
          expect(menuItem.find('DiveButton').exists()).toBeTruthy()
        })
      })

      describe('onBreadcrumbClick', () => {
        beforeEach(() => {
          const button = wrapper.find(StyledMenuButton).at(0)
          button.simulate('click')
        })

        it('should route to the item', () => {
          expect(props.onBreadcrumbClick).toHaveBeenCalled()
        })
      })

      describe('if breadcrumb name is longer than 20', () => {
        beforeEach(() => {
          props.item.name = 'This is a really long name longer than 20'
          wrapper.setProps(props)
          wrapper.setProps({
            ...props,
            item: {
              ...props.item,
              name: 'This is a really long name longer than 20',
            },
          })
          wrapper.instance().setInitialBaseRecords()
          wrapper.update()
        })

        it('should render a tooltip on the breadcrumb name', () => {
          const menuButton = wrapper.find(StyledMenuButton).at(0)
          expect(menuButton.find(Tooltip).exists()).toBeTruthy()
        })
      })

      describe('with sub items on breadcrumb', () => {
        beforeEach(() => {
          props.item = {
            ...props.item,
            ellipses: true,
            subItems: [
              {
                id: '5',
                name: 'Item 4',
                nested: 1,
              },
              {
                id: '6',
                name: 'Item 5',
                nested: 2,
              },
            ],
          }
          wrapper.setProps(props)
          wrapper.instance().setInitialBaseRecords()
        })

        it('should render a menu item for each sub item', () => {
          expect(wrapper.find(StyledMenuItem).length).toEqual(2)
        })

        it('should render nested lines', () => {
          const menuButton = wrapper.find(StyledMenuButton).at(1)
          expect(menuButton.find('NestedLineHolder').length).toEqual(1)
        })
      })
    })

    describe('with a sub item open', () => {
      let parentMenuWrapper
      let subMenu
      let subMenuWrapper

      beforeEach(() => {
        props.item.breadcrumbDropDownRecords = [
          { name: 'nested item 1', id: '10', has_children: true },
          { name: 'nested item 2', id: '11', has_children: false },
        ]
        props.item.subMenuOpen = true
        rerender()
        wrapper.setState({
          dropdownOpen: true,
          menuItemOpenId: 1,
        })
        parentMenuWrapper = wrapper.find(StyledMenuWrapper).at(0)
        subMenu = parentMenuWrapper.find(StyledMenu).at(0)
        subMenuWrapper = parentMenuWrapper.find(StyledMenuWrapper).at(1)
      })

      it('should render the sub menu', () => {
        expect(subMenu.exists()).toBe(true)
      })

      it('should render a menu item for each breadcrumb drop down record', () => {
        expect(subMenuWrapper.find(StyledMenuItem).length).toEqual(2)
      })

      describe('with a nested position set', () => {
        beforeEach(() => {
          wrapper.instance().nestedMenuX = 10
          wrapper.instance().nestedMenuY = 50
          wrapper.instance().forceUpdate()
          // Have to refind these or they won't be updated
          parentMenuWrapper = wrapper.find(StyledMenuWrapper).at(0)
          subMenuWrapper = parentMenuWrapper.find(StyledMenuWrapper).at(1)
        })

        it('should set the offset position on the menu wrapper', () => {
          expect(subMenuWrapper.props().offsetPosition).toEqual({
            x: 10,
            y: 50,
          })
        })
      })
    })

    describe('with link', () => {
      beforeEach(() => {
        wrapper.setProps({
          ...props,
          item: {
            ...props.item,
            link: true,
          },
        })
      })

      it('renders a tooltip with the "switch to" location button', () => {
        const tooltip = wrapper.find(Tooltip)
        expect(tooltip.props().title).toMatch(`switch to ${props.item.name}`)
        expect(tooltip.find('StyledRestoreButton').exists()).toBeTruthy()
      })
    })
  })

  describe('onBreadcrumbHoverOver', () => {
    it('should open the dropdown', () => {
      breadcrumbItem.simulate('mouseover')
      expect(wrapper.state().dropdownOpen).toBe(true)
    })
  })

  describe('onBreadcrumbHoverOut', () => {
    it('should close the dropdown after a certain amount of time', () => {
      breadcrumbItem.simulate('mouseout')
      expect(setTimeout).toHaveBeenLastCalledWith(
        wrapper.instance().closeDropdown,
        50
      )
    })
  })
})
