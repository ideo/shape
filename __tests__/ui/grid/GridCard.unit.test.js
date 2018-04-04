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
  onMoveStart: jest.fn(),
  handleMove: jest.fn(),
  dragging: false,
  height: 100,
  menuOpen: false,
  canEditCollection: false,
  isSharedCollection: false,
}

let wrapper
describe('GridCard', () => {
  describe('with item', () => {
    beforeEach(() => {
      props.record.can_edit = false
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
      expect(wrapper.find('StyledGridCard').find('LinkIcon').exists()).toBe(false)
    })

    it('renders menu', () => {
      expect(wrapper.find('.card-menu').exists()).toBe(true)
    })

    it('does not render selection circle or hotspot', () => {
      expect(wrapper.find('SelectionCircle').exists()).toBe(false)
      expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
    })

    describe('as editor', () => {
      beforeEach(() => {
        props.record.can_edit = true
        props.canEditCollection = true
        wrapper = shallow(
          <GridCard {...props} />
        )
      })

      it('passes canEdit to menu', () => {
        expect(wrapper.find('.card-menu').props().canEdit).toBe(true)
      })

      it('renders selection circle and hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
      })
    })

    describe('as link', () => {
      beforeEach(() => {
        props.card.link = true
        wrapper = shallow(
          <GridCard {...props} />
        )
      })

      it('renders the link icon', () => {
        expect(wrapper.find('StyledGridCard').find('LinkIcon').exists()).toBe(true)
      })
    })
  })

  describe('with collection', () => {
    beforeEach(() => {
      props.cardType = 'collections'
      props.card = fakeCollectionCard
      props.record = fakeCollection
      props.record.can_edit = false
      wrapper = shallow(
        <GridCard {...props} />
      )
    })

    it('renders the collection cover', () => {
      expect(wrapper.find('CollectionCover').props().collection).toEqual(fakeCollection)
    })

    it('renders the collection icon', () => {
      expect(wrapper.find('StyledGridCard').find('CollectionIcon').exists()).toBe(true)
    })

    it('renders menu and selection circle', () => {
      expect(wrapper.find('.card-menu').exists()).toBe(true)
    })

    it('does not render selection circle or hotspot', () => {
      expect(wrapper.find('SelectionCircle').exists()).toBe(false)
      expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
    })

    describe('as editor', () => {
      beforeEach(() => {
        props.record.can_edit = true
        props.canEditCollection = true
        wrapper = shallow(
          <GridCard {...props} />
        )
      })

      it('passes canEdit to menu', () => {
        expect(wrapper.find('.card-menu').props().canEdit).toBe(true)
      })

      it('renders selection circle and hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
      })
    })

    describe('as link', () => {
      beforeEach(() => {
        props.card.link = true
        wrapper = shallow(
          <GridCard {...props} />
        )
      })

      it('has linked collection icon', () => {
        expect(wrapper.find('StyledGridCard').find('LinkedCollectionIcon').exists()).toBe(true)
      })
    })
  })
})
