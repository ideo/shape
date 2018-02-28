import GridCard from '~/ui/grid/GridCard'

import {
  fakeItemCard,
  fakeCollectionCard,
  fakeCollection,
  fakeTextItem,
} from '#/mocks/data'

const props = {
  card: fakeItemCard,
  cardType: 'items',
  record: fakeTextItem,
  handleClick: jest.fn(),
  dragging: false,
  height: 100,
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

    it('does not render link icon if card is primary', () => {
      expect(wrapper.find('StyledGridCardInner').find('LinkIcon').exists()).toBe(false)
    })

    describe('as reference', () => {
      beforeEach(() => {
        props.card.reference = true
        wrapper = shallow(
          <GridCard {...props} />
        )
      })

      it('renders the link icon', () => {
        expect(wrapper.find('StyledGridCardInner').find('LinkIcon').exists()).toBe(true)
      })
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

    it('renders the collection icon', () => {
      expect(wrapper.find('StyledGridCardInner').find('CollectionIcon').exists()).toBe(true)
    })

    describe('as reference', () => {
      beforeEach(() => {
        props.card.reference = true
        wrapper = shallow(
          <GridCard {...props} />
        )
      })

      it('has linked collection icon', () => {
        expect(wrapper.find('StyledGridCardInner').find('LinkedCollectionIcon').exists()).toBe(true)
      })
    })
  })
})
