import CardMenu from '~/ui/grid/CardMenu'

const props = {
  cardId: 123,
  canEdit: false,
  handleShare: jest.fn(),
  handleDuplicate: jest.fn(),
  handleLink: jest.fn(),
  handleOrganize: jest.fn(),
  handleArchive: jest.fn(),
  uiStore: {
    openCardMenuId: false,
    openCardMenu: jest.fn(),
  },
  menuOpen: false,
}

const fakeMouseEvent = { stopPropagation: jest.fn() }

let wrapper, actions
describe('CardMenu', () => {
  describe('as editor', () => {
    beforeEach(() => {
      actions = [
        'Share',
        'Duplicate',
        'Link',
        'Organize',
        'Archive'
      ]
      props.canEdit = true
      wrapper = shallow(
        <CardMenu.wrappedComponent {...props} />
      )
    })

    it('renders a toggle button', () => {
      expect(wrapper.find('StyledMenuToggle').exists()).toBe(true)
    })

    it('renders menu', () => {
      expect(wrapper.find('StyledMenuWrapper').exists()).toBe(true)
    })

    it('has all menu items with click handlers', () => {
      expect(wrapper.find('StyledMenuItem').length).toEqual(actions.length)
      actions.forEach(action => {
        expect(wrapper.find(`.menu-${action.toLowerCase()}`).exists()).toBe(true)
        const handlerFn = props[`handle${action}`]
        expect(wrapper.find(`.menu-${action.toLowerCase()}`).props().onClick).toEqual(handlerFn)
      })
    })

    it('has "open" CSS class if menu is open', () => {
      wrapper = shallow(
        <CardMenu.wrappedComponent {...props} menuOpen />
      )
      expect(wrapper.find('.open').exists()).toBe(true)
    })

    it('calls openCardMenu on uiStore on click', () => {
      wrapper.find('StyledMenuToggle').at(0).simulate('click', fakeMouseEvent)
      expect(fakeMouseEvent.stopPropagation).toHaveBeenCalledWith()
      expect(props.uiStore.openCardMenu).toHaveBeenCalledWith(props.cardId)
    })
  })

  describe('as viewer', () => {
    beforeEach(() => {
      actions = ['Duplicate']
      props.canEdit = false
      wrapper = shallow(
        <CardMenu.wrappedComponent {...props} />
      )
    })

    it('renders menu', () => {
      expect(wrapper.find('StyledMenuWrapper').exists()).toBe(true)
    })

    it('only has actions defined', () => {
      expect(wrapper.find('StyledMenuItem').length).toEqual(actions.length)
      actions.forEach(action => {
        expect(wrapper.find(`.menu-${action.toLowerCase()}`).exists()).toBe(true)
      })
    })
  })
})
