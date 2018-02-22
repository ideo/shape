import GridCard from '~/ui/grid/GridCard'

import {
  fakeCard,
  fakeItem,
} from '#/mocks/data'

const props = {
  card: fakeCard,
  cardType: 'items',
  record: fakeItem,
  handleClick: jest.fn(),
  dragging: false,
}

let wrapper
describe('GridCard', () => {
  beforeEach(() => {
    wrapper = shallow(
      <GridCard {...props} />
    )
  })

  it('renders a StyledGridCard with passed in dragging prop', () => {
    expect(wrapper.find('StyledGridCard').props().dragging).toBe(props.dragging)
  })

  it('renders a StyledGridCardInner with passed in onClick prop', () => {
    expect(wrapper.find('StyledGridCardInner').props().onClick).toEqual(wrapper.instance().handleClick)
  })

  it('renders the item name', () => {
    expect(wrapper.find('StyledGridCardInner').children().text()).toContain(fakeItem.name)
  })
})
