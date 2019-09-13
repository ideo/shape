import GridCard from '~/ui/grid/GridCard'
import { uiStore } from '~/stores'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

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
  searchResult: false,
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

      it('renders snapshot', () => {
        expectTreeToMatchSnapshot(wrapper)
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

      it('renders snapshot', () => {
        expectTreeToMatchSnapshot(wrapper)
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
        uiStore.viewingRecord = { breadcrumb: [] }
        uiStore.update = jest.fn()
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

      it('calls storeLinkedBreadcrumb on handleClick', () => {
        wrapper.instance().handleClick({})
        expect(uiStore.update).toHaveBeenCalledWith(
          'actionAfterRoute',
          expect.any(Function)
        )
      })
    })

    describe('with an image file', () => {
      beforeEach(() => {
        props.card.record = { ...fakeFileItem }
        props.record = props.card.record
        props.record.canBeSetAsCover = true
        props.record.isImage = true
        props.cardType = 'items'
        rerender()
      })

      it('renders a CoverImageToggle', () => {
        expect(wrapper.find('CoverImageToggle').exists()).toBeTruthy()
      })

      it('renders a ContainImage', () => {
        expect(wrapper.find('ContainImage').exists()).toBeTruthy()
      })
    })

    describe('with a private item', () => {
      beforeEach(() => {
        props.card.record = { ...fakeTextItem, is_private: true }
        props.record = props.card.record
        props.cardType = 'items'
        rerender()
      })

      it('renders a HiddenIconButton', () => {
        expect(wrapper.find('HiddenIconButton').exists()).toBeTruthy()
      })
    })
  })
  // -------------------
  // <--- end 'with item'

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

      it('renders snapshot', () => {
        expectTreeToMatchSnapshot(wrapper)
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

      it('does not render CardCoverEditor', () => {
        expect(wrapper.find('CardCoverEditor').exists()).toBe(false)
      })
    })

    describe('as editor', () => {
      beforeEach(() => {
        props.record.can_edit = true
        props.canEditCollection = true
        rerender()
      })

      it('renders snapshot', () => {
        expectTreeToMatchSnapshot(wrapper)
      })

      it('passes canEdit to menu', () => {
        expect(wrapper.find('ActionMenu').props().canEdit).toBe(true)
      })

      it('renders selection circle and hotspot', () => {
        expect(wrapper.find('SelectionCircle').exists()).toBe(true)
        expect(wrapper.find('GridCardHotspot').exists()).toBe(true)
      })

      describe('if record.canSetACover = true', () => {
        beforeEach(() => {
          props.record.canSetACover = true
          rerender()
        })

        it('renders CardCoverEditor', () => {
          expect(wrapper.find('CardCoverEditor').exists()).toBe(true)
        })
      })
    })

    describe('with SharedCollection', () => {
      beforeEach(() => {
        props.isSharedCollection = true
        props.canEditCollection = false
        rerender()
      })

      it('renders snapshot', () => {
        expectTreeToMatchSnapshot(wrapper)
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

      it('renders snapshot', () => {
        expectTreeToMatchSnapshot(wrapper)
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
  })

  describe('when hoveringOver', () => {
    beforeEach(() => {
      props.hoveringOver = true
      rerender()
    })

    it('renders snapshot', () => {
      expectTreeToMatchSnapshot(wrapper)
    })

    it('renders the colored circle to indicate selection', () => {
      expect(wrapper.find('StyledGridCard').props().selected).toBe(true)
    })
  })

  describe('when selected', () => {
    beforeEach(() => {
      props.hoveringOver = false
      uiStore.selectCardId(props.card.id)
      rerender()
    })

    it('renders snapshot', () => {
      expectTreeToMatchSnapshot(wrapper)
    })

    it('renders the colored circle to indicate selection', () => {
      expect(wrapper.find('StyledGridCard').props().selected).toBe(true)
    })

    afterEach(() => {
      uiStore.deselectCards()
    })
  })

  describe('with searchResult', () => {
    beforeEach(() => {
      props.searchResult = true
      props.record.can_edit = true
      props.record.menuDisabled = false
      rerender()
    })

    it('renders snapshot', () => {
      expectTreeToMatchSnapshot(wrapper)
    })

    it('disables canEdit functionality', () => {
      expect(wrapper.find('ActionMenu').props().canEdit).toBe(false)
    })
  })
})
