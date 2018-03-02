import CardMenu from '~/ui/grid/CardMenu'

const props = {
  cardId: 123,
  handleShare: jest.fn(),
  handleDuplicate: jest.fn(),
  handleLink: jest.fn(),
  handleOrganize: jest.fn(),
  handleArchive: jest.fn(),
  uiStore: {
    openCardMenu: null
  },
}

const actions = [
  'Share',
  'Duplicate',
  'Link',
  'Organize',
  'Archive'
]

let wrapper
describe('CardMenu', () => {
  beforeEach(() => {
    wrapper = shallow(
      <CardMenu.wrappedComponent {...props} />
    )
  })

  it('renders a toggle button', () => {
    expect(wrapper.find('StyledMenuToggle').exists()).toBe(true)
  })

  it('renders menu', () => {
    expect(wrapper.find('StyledMenuWrapper').exists()).toEqual(true)
  })

  it('has all menu items with click handlers', () => {
    actions.forEach(action => {
      expect(wrapper.find(`.menu-${action.toLowerCase()}`).exists()).toEqual(true)
      const handlerFn = props[`handle${action}`]
      expect(wrapper.find(`.menu-${action.toLowerCase()}`).props().onClick).toEqual(handlerFn)
    })
  })
})
