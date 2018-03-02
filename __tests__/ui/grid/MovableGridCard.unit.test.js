import MovableGridCard from '~/ui/grid/MovableGridCard'
import _ from 'lodash'

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
  onResize: jest.fn(),
  onMoveStop: jest.fn(),
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

    it('renders a "Rnd" Resize-n-Draggable component', () => {
      expect(wrapper.find('Rnd').exists()).toBe(true)
    })

    it('passes position props to Rnd component', () => {
      expect(wrapper.find('Rnd').props().size).toEqual(_.pick(fakePosition, ['width', 'height']))
      expect(wrapper.find('Rnd').props().enableResizing.bottomRight).toBe(true)
    })

    it('passes ResizeIcon to Rnd component', () => {
      const ep = wrapper.find('Rnd').props().extendsProps
      const handleComponentWrapper = shallow(<ep.handleComponent.bottomRight />)
      expect(handleComponentWrapper.find('ResizeIcon').exists()).toBe(true)
    })

    it('renders a GridCard component', () => {
      expect(wrapper.find('GridCard').props().card).toBe(fakeItemCard)
      expect(wrapper.find('GridCard').props().cardType).toBe('items')
      expect(wrapper.find('GridCard').props().record).toBe(fakeTextItem)
    })
  })
})
