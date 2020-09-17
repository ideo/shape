import _ from 'lodash'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import FoamcoreInteractionLayer from '~/ui/grid/interactionLayer/FoamcoreInteractionLayer'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'
import { FOAMCORE_INTERACTION_LAYER } from '~/utils/variables'

// because of mdlPlaceholder... without this mock it blows up
jest.mock('~/stores/jsonApi/CollectionCard')
// also allows us to mock + test that the model constructor was called
CollectionCard.mockImplementation((data, apiStore) => {
  return data
})

function createCard(data) {
  idCounter += 1
  const id = idCounter.toString()
  return {
    ...fakeCollectionCard,
    ...data,
    id,
    record: { internalType: 'items' },
  }
}

let cardA, cardB, cardC
let idCounter = 0

let props, wrapper, component, rerender
describe('FoamcoreInteractionLayer', () => {
  beforeEach(() => {
    cardA = createCard({ row: 1, col: 5 })
    cardB = createCard({ row: 0, col: 1, width: 2, height: 2 })
    cardC = createCard({ row: 2, col: 0, width: 2 })
    const collection = fakeCollection

    collection.num_columns = 16
    collection.cardMatrix = [[], [], []]
    collection.cardMatrix[1][5] = cardA
    collection.cardMatrix[0][1] = cardB
    collection.cardMatrix[1][1] = cardB
    collection.cardMatrix[2][0] = cardC
    collection.cardMatrix[2][1] = cardC
    /*
      [ x B x x x x ... ]
      [ x B x x x A ... ]
      [ C C x x x x ... ]
     */

    collection.collection_cards = [cardA, cardB, cardC]
    collection.confirmEdit = jest.fn()

    props = {
      collection,
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      coordinatesForPosition: jest
        .fn()
        .mockReturnValue({ col: 1, row: 1, outsideDraggableArea: false }),
    }
    rerender = () => {
      props.collection.API_batchUpdateCardsWithUndo.mockClear()
      wrapper = shallow(
        <FoamcoreInteractionLayer.wrappedComponent {...props} />
      )
      component = wrapper.instance()
    }
    rerender()
    component.gridRef = { scrollLeft: 0, scrollTop: 0 }
  })

  describe('onCursorMove', () => {
    let fakeEv
    beforeEach(() => {
      fakeEv = {
        clientX: 100,
        clientY: 200,
        target: {
          classList: [FOAMCORE_INTERACTION_LAYER],
        },
      }
      component.resetHoveringRowCol = jest.fn()
    })

    it('should ignore events that are outside foamcoreGridBoundary', () => {
      fakeEv.target = {
        classList: ['other'],
      }
      const cursorMoveEvent = component.onCursorMove('mouse')
      const result = cursorMoveEvent(fakeEv)
      expect(result).toEqual(true)
    })

    it('not show a positioned blank card a card is already there', () => {
      const cursorMoveEvent = component.onCursorMove('mouse')
      cursorMoveEvent(fakeEv)
      expect(component.resetHoveringRowCol).toHaveBeenCalled()
    })

    describe('when hovering over a spot with no cards', () => {
      beforeEach(() => {
        props.coordinatesForPosition = jest
          .fn()
          .mockReturnValue({ col: 1, row: 4, outsideDraggableArea: false })
        fakeEv = {
          clientX: 720,
          clientY: 360,
          target: {
            classList: [FOAMCORE_INTERACTION_LAYER],
          },
        }
        rerender()
        component.throttledRepositionBlankCard = jest.fn()
      })

      it('not show a positioned blank card a card is already there', () => {
        const cursorMoveEvent = component.onCursorMove('mouse')
        cursorMoveEvent(fakeEv)
        expect(component.throttledRepositionBlankCard).toHaveBeenCalled()
      })
    })
  })

  describe('resizing', () => {
    beforeEach(() => {
      const placeholderSpot = {
        row: 1,
        col: 1,
      }
      const uiStore = fakeUiStore
      uiStore.placeholderSpot = placeholderSpot
      props = {
        collection: fakeCollection,
        apiStore: fakeApiStore(),
        uiStore,
        resizing: true,
      }
      rerender()
    })
    it('should render a PositionedBlankCard with resizing interactionType', () => {
      expect(wrapper.find('PositionedBlankCard').exists()).toBeTruthy()
      expect(
        wrapper.find('PositionedBlankCard').props().interactionType
      ).toEqual('resize')
    })
  })

  describe('dragging', () => {
    beforeEach(() => {
      const dragGridSpot = {
        values: jest.fn().mockReturnValue([{ row: 1, col: 1 }]),
        size: 1,
      }
      const uiStore = fakeUiStore
      uiStore.dragGridSpot = dragGridSpot
      props = {
        collection: fakeCollection,
        apiStore: fakeApiStore(),
        uiStore,
        dragging: true,
        hoveringOverCollection: false,
      }
      rerender()
    })
    it('should render a PositionedBlankCard with resizing interactionType', () => {
      expect(wrapper.find('PositionedBlankCard').exists()).toBeTruthy()
      expect(
        wrapper.find('PositionedBlankCard').props().interactionType
      ).toEqual('drag')
    })
  })

  describe('dropping files', () => {
    beforeEach(() => {
      const uiStore = fakeUiStore
      uiStore.droppingFilesCount = 4
      uiStore.visibleRows = {
        min: 0,
        max: 4,
        num: 4,
      }
      uiStore.visibleCols = {
        min: 0,
        max: 4,
        num: 4,
      }
      const collection = fakeCollection
      collection.max_row_index = 2
      collection.num_columns = 2
      collection.cardMatrix = [[1, 1], [1, 2]]
      props = {
        collection,
        apiStore: fakeApiStore(),
        uiStore,
        resizing: false,
        dragging: false,
        coordinatesForPosition: jest.fn().mockReturnValue({ row: 0, col: 0 }),
      }
      rerender()
      component.calculateOpenSpot = jest.fn().mockReturnValue({
        row: 1,
        col: 2,
        width: 1,
        height: 1,
      }) // mock value for testing
    })

    it('should render a PositionedBlankCard with dropping interactionType', () => {
      expect(component.renderDropSpots.length > 0).toEqual(true)
    })
  })

  describe('renderHotspots', () => {
    beforeEach(() => {
      props.collection.isFourWideBoard = true
      rerender()
    })

    describe('with one card at the beginning of a row and none touching', () => {
      xit('should have vertical hotspots at the beginning of every row', () => {
        component.positionBlank(
          {
            row: 2,
            col: 1,
            width: 1,
            height: 1,
          },
          'hover'
        )
        const hotspots = wrapper.find('FoamcoreHotEdge')
        // default cardMatrix only has card C at the beginning of the row
        expect(hotspots.find({ horizontal: false }).length).toEqual(1)
        expect(hotspots.find({ horizontal: true }).length).toEqual(3)
      })

      describe('with pinnedAndLocked cards', () => {
        beforeEach(() => {
          cardB.row = 2
          cardB.isPinnedAndLocked = true
          rerender()
        })

        xit('should not render hot edges that would push pinnedAndLocked cards down', () => {
          const hotspots = wrapper.find('FoamcoreHotEdge')
          // should only have the one horizontal "insert row" at row = 2
          expect(hotspots.find({ horizontal: true }).length).toEqual(1)
          expect(hotspots.find({ horizontal: true }).get(0).props.row).toEqual(
            2
          )
        })
      })
    })

    describe('with two cards at the beginning of a row and two touching', () => {
      beforeEach(() => {
        props.collection.cardMatrix[1][0] = cardA
        props.maxRow = _.maxBy(props.collection.collection_cards, 'row').row
        rerender()
      })

      it('should have vertical hotspots at the beginning of every row', () => {
        // cardA now is at the beginning of the row AND bumps into cardB (+2)
        const hotspots = wrapper.find('FoamcoreHotEdge')
        expect(hotspots.find({ horizontal: false }).length).toEqual(3)
        expect(hotspots.find({ horizontal: true }).length).toEqual(3)
      })
    })

    describe('with two cards at the beginning of a row and two touching', () => {
      beforeEach(() => {
        props.collection.isFourWideBoard = true
        props.maxRow = _.maxBy(props.collection.collection_cards, 'row').row
        rerender()
      })

      it('should have horizontal hotspots between rows', () => {
        expect(wrapper.find('FoamcoreHotEdge').length).toEqual(4)
        const hotspotProps = wrapper.find('FoamcoreHotEdge').map(h => h.props())
        // 1 vertical edge and 3 row hotspots
        expect(hotspotProps.filter(p => p.horizontal).length).toEqual(3)
        expect(hotspotProps.filter(p => !p.horizontal).length).toEqual(1)
      })
    })
  })
})
