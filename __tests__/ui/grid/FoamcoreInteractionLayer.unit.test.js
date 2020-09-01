import FoamcoreInteractionLayer from '~/ui/grid/dragLayer/FoamcoreInteractionLayer'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'
import { FOAMCORE_DRAG_LAYER } from '~/utils/variables'

let props, wrapper, component, rerender
describe('FoamcoreInteractionLayer', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
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
      uiStore.droppingFiles = true
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
        resizing: true,
      }
      rerender()
    })
    it('should render a PositionedBlankCard with resizing interactionType', () => {
      expect(wrapper.find('PositionedBlankCard').exists()).toBeTruthy()
    })
  })

  describe('onCursorMove', () => {
    const fakeEv = {
      clientX: 100,
      clientY: 200,
      classList: [FOAMCORE_DRAG_LAYER],
    }

    xit('should look up coordinatesForPosition', () => {
      const result = component.onCursorMove(fakeEv)
      expect(result).toEqual({
        col: 0,
        row: 1,
      })
    })

    it('should ignore events that are outside foamcoreGridBoundary', () => {
      fakeEv.target = {
        classList: ['other'],
      }
      const result = component.onCursorMove(fakeEv)
      expect(result).toEqual(true)
    })
  })
})
