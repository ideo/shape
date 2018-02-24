import GridCard from '~/ui/grid/GridCard'

import {
  fakeCard,
  fakeCollectionCard,
  fakeCollection,
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
  describe('with item', () => {
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

    it('renders the item content', () => {
      expect(wrapper.find('StyledGridCardInner').children().html()).toContain(fakeItem.content)
    })
  })

  describe('with collection', () => {
    beforeEach(() => {
      props.cardType = 'collections'
      props.card = fakeCollectionCard
      props.record = fakeCollection
      wrapper = shallow(
        <GridCard {...props} />
      )
    })

    it('renders the collection cover', () => {
      expect(wrapper.find('CollectionCover').props().collection).toEqual(fakeCollection)
    })
  })
})
