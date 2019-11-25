import FilterMenu from '~/ui/filtering/FilterMenu'

let wrapper, rerender, props

describe('FilterMenu', () => {
  beforeEach(() => {
    props = {
      onFilterByTag: jest.fn(),
      onFilterBySearch: jest.fn(),
      alignTop: true,
    }
    rerender = function() {
      wrapper = shallow(<FilterMenu {...props} />)
      return wrapper
    }
    rerender()
  })

  describe('render()', () => {
    const getPopoutMenu = () => wrapper.find('PopoutMenu')

    it('should have the popout menu closed by default', () => {
      expect(getPopoutMenu().props().menuOpen).toBe(false)
    })

    describe('when the filterBar is active', () => {
      it('should set the FilterIconHolder to have 5px top margin', () => {
        const iconHolder = wrapper.find('FilterIconHolder').dive()
        expect(iconHolder).toHaveStyleRule('margin-top', '5px')
      })
    })

    describe('when the filterBar is inactive', () => {
      beforeEach(() => {
        props.alignTop = false
        rerender()
      })

      it('should set the FilterIconHolder to negative top margin', () => {
        const iconHolder = wrapper.find('FilterIconHolder').dive()
        expect(iconHolder).toHaveStyleRule('margin-top', '-24px')
      })
    })

    describe('when dropdown is open', () => {
      beforeEach(() => {
        wrapper.setState({
          filterDropdownOpen: true,
        })
      })

      it('should open the PopoutMenu', () => {
        expect(getPopoutMenu().props().menuOpen).toBe(true)
      })
    })
  })

  describe('byTag', () => {
    beforeEach(() => {
      wrapper.instance().byTag()
    })

    it('should set the dropdown state to false', () => {
      expect(wrapper.state('filterDropdownOpen')).toBe(false)
    })

    it('should call the onFilterByTag prop', () => {
      expect(props.onFilterByTag).toHaveBeenCalled()
    })
  })

  describe('bySearch', () => {
    beforeEach(() => {
      wrapper.instance().bySearch()
    })

    it('should set the dropdown state to false', () => {
      expect(wrapper.state('filterDropdownOpen')).toBe(false)
    })

    it('should call the onFilterBySearch prop', () => {
      expect(props.onFilterBySearch).toHaveBeenCalled()
    })
  })
})
