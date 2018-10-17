import GridCard from '~/ui/grid/GridCard'

import {
  fakeItemCard,
  fakeCollectionCard,
  fakeCollection,
  fakeFileItem,
  fakeTextItem,
} from '#/mocks/data'

const props = {
  card: fakeItemCard,
  cardType: 'items',
  record: fakeTextItem,
  handleClick: jest.fn(),
  onMoveStart: jest.fn(),
  dragging: false,
  height: 100,
  menuOpen: false,
  canEditCollection: false,
  isSharedCollection: false,
}

let wrapper, rerender
describe('GridCard', () => {
  describe('with item', () => {
    beforeEach(() => {
      rerender = function() {
        wrapper = shallow(<GridCard {...props} />)
        return wrapper
      }
    })

    describe('as viewer', () => {
      beforeEach(() => {
        props.record.can_edit = false
        rerender()
      })

      it('renders a StyledGridCard with passed in dragging prop', () => {
        expect(wrapper.find('StyledGridCard').props().dragging).toBe(
          props.dragging
        )
      })

      it('renders a StyledGridCardInner with passed in onClick prop', () => {
        expect(wrapper.find('StyledGridCardInner').props().onClick).toEqual(
          wrapper.instance().handleClick
        )
      })

      it('does not render link icon if card is primary', () => {
        expect(
          wrapper
            .find('StyledGridCard')
            .find('LinkIcon')
            .exists()
        ).toBe(false)
      })

      it('renders menu', () => {
        expect(wrapper.find('ActionMenu').exists()).toBe(true)
      })

      it('renders selection circle without hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
      })
    })

    describe('as editor', () => {
      beforeEach(() => {
        props.record.can_edit = true
        props.canEditCollection = true
        wrapper.setProps(props)
        rerender()
      })

      it('passes canEdit to menu', () => {
        expect(wrapper.find('ActionMenu').props().canEdit).toBe(true)
      })

      it('renders selection circle and hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(true)
      })
    })

    describe('as first item in the row', () => {
      beforeEach(() => {
        props.record.can_edit = true
        props.canEditCollection = true
        props.card.position = { x: 0 }
        rerender()
      })

      it('renders hotspot to the left and right', () => {
        expect(
          wrapper
            .find('GridCardHotspot')
            .at(0)
            .props().position
        ).toBe('right')
        expect(
          wrapper
            .find('GridCardHotspot')
            .at(1)
            .props().position
        ).toBe('left')
      })
    })

    describe('as link', () => {
      beforeEach(() => {
        props.card.link = true
        rerender()
      })

      it('renders the link icon', () => {
        expect(
          wrapper
            .find('StyledGridCard')
            .find('LinkIcon')
            .exists()
        ).toBe(true)
      })
    })
  })

  describe('with collection', () => {
    describe('as viewer', () => {
      beforeEach(() => {
        props.cardType = 'collections'
        props.card = fakeCollectionCard
        props.canEditCollection = false
        props.record = fakeCollection
        props.record.can_edit = false
        rerender()
      })

      it('renders the collection cover', () => {
        expect(wrapper.find('CollectionCover').props().collection).toEqual(
          fakeCollection
        )
      })

      it('renders the collection icon', () => {
        expect(
          wrapper
            .find('StyledGridCard')
            .find('CollectionIcon')
            .exists()
        ).toBe(true)
      })

      it('renders menu and selection circle', () => {
        expect(wrapper.find('ActionMenu').exists()).toBe(true)
      })

      it('renders selection circle without hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
      })
    })

    describe('as editor', () => {
      beforeEach(() => {
        props.record.can_edit = true
        props.canEditCollection = true
        rerender()
      })

      it('passes canEdit to menu', () => {
        expect(wrapper.find('ActionMenu').props().canEdit).toBe(true)
      })

      it('renders selection circle and hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(true)
      })
    })

    describe('with SharedCollection', () => {
      beforeEach(() => {
        props.isSharedCollection = true
        props.canEditCollection = false
        rerender()
      })

      it('renders selection circle and card menu, but no hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('ActionMenu').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(false)
      })
    })

    describe('with SharedCollection card (menuDisabled = true)', () => {
      beforeEach(() => {
        props.isSharedCollection = false
        props.canEditCollection = true
        props.record.menuDisabled = true
        rerender()
      })

      it('does not render ActionMenu', () => {
        expect(wrapper.find('ActionMenu').exists()).toBe(false)
      })
    })

    describe('as reference', () => {
      beforeEach(() => {
        props.card.link = true
        rerender()
      })

      it('has linked collection icon', () => {
        expect(
          wrapper
            .find('StyledGridCard')
            .find('LinkedCollectionIcon')
            .exists()
        ).toBe(true)
      })
    })

    describe('with a pdf file', () => {
      beforeEach(() => {
        props.card.record = fakeFileItem
        props.record = fakeFileItem
        fakeFileItem.isPdfFile = true
        fakeFileItem.isGenericFile = false
        props.cardType = 'items'
        rerender()
      })

      it('renders a generic file cover', () => {
        expect(wrapper.find('PdfFileItemCover').exists()).toBeTruthy()
      })
    })

    describe('with a generic file', () => {
      beforeEach(() => {
        props.card.record = fakeFileItem
        props.record = fakeFileItem
        fakeFileItem.isGenericFile = true
        fakeFileItem.isPdfFile = false
        props.cardType = 'items'
        rerender()
      })

      it('renders a generic file cover', () => {
        expect(wrapper.find('GenericFileItemCover').exists()).toBeTruthy()
      })
    })
  })
})
