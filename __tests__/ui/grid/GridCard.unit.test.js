import GridCard from '~/ui/grid/GridCard'
import { uiStore } from '~/stores'

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
  canEditCollection: false,
  isSharedCollection: false,
  searchResult: false,
}

let wrapper, component
const rerender = function() {
  props.handleClick.mockClear()
  wrapper = shallow(<GridCard {...props} />)
  component = wrapper.instance()
  return wrapper
}

describe('GridCard', () => {
  describe('with item', () => {
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

    describe('menuOpen', () => {
      it('opens and closes via openActionMenu and closeMenu', () => {
        expect(component.menuOpen).toBe(false)
        const fakeEvent = { target: { closest: jest.fn() } }
        // NOTE: this test works because this file imports the actual uiStore
        component.openActionMenu(fakeEvent)
        expect(component.menuOpen).toBe(true)
        component.closeMenu()
        expect(component.menuOpen).toBe(false)
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
        ).toBe('left')
        expect(
          wrapper
            .find('GridCardHotspot')
            .at(1)
            .props().position
        ).toBe('right')
      })
    })

    describe('as link', () => {
      beforeEach(() => {
        props.card.link = true
        uiStore.viewingRecord = { breadcrumb: [] }
        uiStore.update = jest.fn()
        rerender()
      })

      it('calls storeLinkedBreadcrumb on handleClick', () => {
        wrapper.instance().handleClick({})
        expect(uiStore.update).toHaveBeenCalledWith(
          'actionAfterRoute',
          expect.any(Function)
        )
        expect(props.handleClick).toHaveBeenCalled()
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

      it('renders the bottom left card icons', () => {
        expect(
          wrapper
            .find('StyledGridCard')
            .find('BottomLeftCardIcons')
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
  })

  describe('with loadingPlaceholder', () => {
    beforeEach(() => {
      props.card.isLoadingPlaceholder = true
      rerender()
    })
    afterEach(() => {
      props.card.isLoadingPlaceholder = false
    })

    it('renders the loader and no ActionMenu', () => {
      expect(wrapper.find('ActionMenu').exists()).toBe(false)
      expect(wrapper.find('CardLoader').exists()).toBe(true)
    })

    it('prevents any action on the click handler', () => {
      expect(wrapper.instance().handleClick()).toBe(false)
      expect(props.handleClick).not.toHaveBeenCalled()
    })
  })

  describe('when hoveringOver', () => {
    beforeEach(() => {
      props.hoveringOver = true
      rerender()
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

    it('disables canEdit functionality', () => {
      expect(wrapper.find('ActionMenu').props().canEdit).toBe(false)
    })
  })

  describe('renderReplaceControl', () => {
    beforeEach(() => {
      props.card.show_replace = true
      props.card.record.isMedia = true
      props.card.record.has_replaced_media = false
      props.card.parentCollection = { isTemplated: true }
      props.canEditCollection = true
      rerender()
    })

    it('renders the the replace control', () => {
      const replaceButton = wrapper.find('ReplaceCardButton')
      expect(replaceButton.props().card).toEqual(props.card)
      expect(replaceButton.props().showControls).toEqual(false)
    })
  })

  describe('renderTopRightActions', () => {
    afterEach(() => {
      // clean up values that were changed
      uiStore.editingCardCover = null
      uiStore.hoveringOverDataItem = false
      props.card.record.isData = false
    })

    it('uses show-on-hover class by default', () => {
      const topRight = wrapper.find('StyledTopRightActions').last()
      expect(topRight.props().className).toEqual('show-on-hover')
    })

    describe('isEditingCardCover', () => {
      beforeEach(() => {
        uiStore.editingCardCover = props.card.id
        rerender()
      })
      it('uses hide-on-cover-edit class', () => {
        const topRight = wrapper.find('StyledTopRightActions').last()
        expect(topRight.props().className).toEqual('hide-on-cover-edit')
      })
    })

    describe('isHoveringOverDataItem and record.isData', () => {
      beforeEach(() => {
        uiStore.hoveringOverDataItem = true
        props.card.record.isData = true
        rerender()
      })
      it('uses hide-for-data-item class', () => {
        const topRight = wrapper.find('StyledTopRightActions').last()
        expect(topRight.props().className).toEqual('hide-for-data-item')
      })
    })
  })
})
