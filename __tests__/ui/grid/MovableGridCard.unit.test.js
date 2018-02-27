import MovableGridCard from '~/ui/grid/MovableGridCard'
import {
  fakeItemCard,
  fakeTextItem,
  fakePosition,
  fakeCollection
} from '#/mocks/data'

const props = {
  card: fakeItemCard,
  position: fakePosition,
  record: fakeTextItem,
  parent: fakeCollection,
  onDrag: jest.fn(),
  onDragStop: jest.fn(),
  routeTo: jest.fn(),
}

let wrapper
describe('MovableGridCard', () => {
  it('renders a placeholder card if cardType is "placeholder"', () => {
    props.cardType = 'placeholder'
    wrapper = shallow(
      <MovableGridCard {...props} />
    )
    expect(wrapper.find('GridCardPlaceholder').exists()).toBe(true)
  })

  it('renders a blank card creation tool if cardType is "blank"', () => {
    props.cardType = 'blank'
    wrapper = shallow(
      <MovableGridCard {...props} />
    )
    expect(wrapper.find('GridCardBlankHOC').exists()).toBe(true)
  })

  describe('with grid cards for items and collections', () => {
    beforeEach(() => {
      props.cardType = 'items'
      wrapper = shallow(
        <MovableGridCard {...props} />
      )
    })

    it('renders a Draggable component', () => {
      expect(wrapper.find('Draggable').exists()).toBe(true)
    })

    it('renders a PositionedGridCard component', () => {
      expect(wrapper.find('PositionedGridCard').props().width).toBe(fakePosition.width)
      expect(wrapper.find('PositionedGridCard').props().height).toBe(fakePosition.height)
    })

    it('renders a GridCard component', () => {
      expect(wrapper.find('GridCard').props().card).toBe(fakeItemCard)
      expect(wrapper.find('GridCard').props().cardType).toBe('items')
      expect(wrapper.find('GridCard').props().record).toBe(fakeTextItem)
    })
  })
})
