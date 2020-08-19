import CollectionCard from '~/stores/jsonApi/CollectionCard'
import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'
import CardMoveService from '~/utils/CardMoveService'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'
import v from '~/utils/variables'

// because of mdlPlaceholder... without this mock it blows up
jest.mock('../../../app/javascript/stores/jsonApi/CollectionCard')
// also allows us to mock + test that the model constructor was called
CollectionCard.mockImplementation((data, apiStore) => {
  return data
})

let props, wrapper, component, rerender, cards, cardA, cardB, cardC
let idCounter = 0

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

describe('FoamcoreGrid', () => {
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
      canEditCollection: true,
      gridW: 200,
      gridH: 200,
      gutter: 10,
      sortBy: 'order',
      loadCollectionCards: jest.fn(() => Promise.resolve()),
      updateCollection: jest.fn(),
      cardProperties: [],
      blankContentToolState: {},
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
    }
    rerender = () => {
      props.collection.API_batchUpdateCardsWithUndo.mockClear()
      wrapper = shallow(<FoamcoreGrid.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    rerender()
    cards = props.collection.collection_cards
    component.gridRef = { scrollLeft: 0, scrollTop: 0 }
  })

  it('renders MovableGridCards', () => {
    expect(wrapper.find('MovableGridCard').length).toEqual(3)
  })

  describe('findOverlap', () => {
    let fakeCard = { row: 1, col: 5, width: 1, height: 1 }

    it('returns false if uiStore.multiMoveCardIds is empty', () => {
      // as noted in findOverlap, this prevented false positive overlap when you're actually done dragging
      props.uiStore.multiMoveCardIds = []
      const overlap = component.findOverlap(fakeCard)
      expect(overlap).toBe(false)
    })

    it('finds filledSpot (or not) where a card is trying to be dragged', () => {
      // this has to be present for it to trigger an overlap
      props.uiStore.multiMoveCardIds = ['anything']
      // similar to calculateFilledSpots, but given a card (needs width and height >= 1)
      let overlap = component.findOverlap(fakeCard)
      expect(overlap.card).toEqual(cardA)
      // 2x2 should stick out and overlap cardA
      fakeCard = { row: 0, col: 4, width: 2, height: 2 }
      overlap = component.findOverlap(fakeCard)
      expect(overlap.card).toEqual(cardA)
    })
  })

  describe('onDragStart', () => {
    describe('when dragging multiple cards', () => {
      let fakeDragMap, cardId, card
      beforeEach(() => {
        card = cards[0]
        cardId = card.id
        fakeDragMap = [
          {
            card,
            col: 0,
            row: 0,
          },
          {
            card: cards[1],
            col: 1,
            row: 0,
          },
        ]
        component.draggingMap = []
        component.originalCard = jest.fn().mockReturnValue(card)
        component.determineDragMap = jest.fn().mockReturnValue(fakeDragMap)
        component.onDragStart(cardId)
      })

      it('should determine the drag map with card id', () => {
        expect(component.originalCard).toHaveBeenCalledWith(cardId)
        expect(component.determineDragMap).toHaveBeenCalledWith(cardId)
      })

      it('should set the dragging map if dragging multiple cards', () => {
        expect(component.draggingMap).toEqual(fakeDragMap)
      })
    })
  })

  describe('resetCardPositions', () => {
    beforeEach(() => {
      component.moveCards = jest.fn().mockReturnValue()
      component.resizeCard = jest.fn().mockReturnValue()
      component.dragging = true
      props.uiStore.multiMoveCardIds = [cards[0].id]
    })

    it('should stop all dragging', () => {
      component.resetCardPositions()
      expect(component.dragGridSpot.size).toEqual(0)
      expect(component.dragging).toEqual(false)
      expect(props.uiStore.setMovingCards).toHaveBeenCalledWith([])
    })
  })

  describe('coordinatesForPosition', () => {
    it('should calculate the appropriate coordinates', () => {
      const { gridW, gutter } = v.defaultGridSettings
      const zoom = component.relativeZoomLevel
      let x = (gridW + gutter) / zoom
      const y = 0
      let width = 1
      expect(component.coordinatesForPosition({ x, y, width })).toEqual({
        col: 1,
        outsideDraggableArea: false,
        row: 0,
      })
      x = (16 * (gridW + gutter)) / zoom
      width = 4
      expect(component.coordinatesForPosition({ x, y, width })).toEqual({
        // this will get bumped back to 12 (where it fits)
        col: 12,
        outsideDraggableArea: true,
        row: 0,
      })
    })
  })

  describe('render blanks with blank rows', () => {
    beforeEach(() => {
      const collection = fakeCollection
      cardA = createCard({ row: 1, col: 1 })
      // Blank row
      cardB = createCard({ row: 3, col: 2, height: 2 })
      cardC = createCard({ row: 5, col: 1 })
      collection.collection_cards = [cardA, cardB, cardC]
      // special actions only show up for fourWide
      collection.isFourWideBoard = true
      props.collection = collection
      rerender()
    })

    it('should have a modified blank card for empty rows', () => {
      const blankCard = component.positionBlank(
        {
          row: 2,
          col: 1,
          width: 1,
          height: 1,
        },
        'hover'
      )
      const blankCardComponent = mount(blankCard)
      expect(blankCardComponent.find('RightBlankActions').exists()).toBe(true)
    })
  })

  describe('renderHotspots', () => {
    describe('with one card at the beginning of a row and none touching', () => {
      it('should have vertical hotspots at the beginning of every row', () => {
        const hotspots = wrapper.find('FoamcoreHotspot')
        // default cardMatrix only has card C at the beginning of the row
        expect(hotspots.find({ horizontal: false }).length).toEqual(1)
        expect(hotspots.find({ horizontal: true }).length).toEqual(3)
      })
    })

    describe('with two cards at the beginning of a row and two touching', () => {
      beforeEach(() => {
        props.collection.cardMatrix[1][0] = cardA
        rerender()
      })

      it('should have vertical hotspots at the beginning of every row', () => {
        // cardA now is at the beginning of the row AND bumps into cardB (+2)
        const hotspots = wrapper.find('FoamcoreHotspot')
        expect(hotspots.find({ horizontal: false }).length).toEqual(3)
        expect(hotspots.find({ horizontal: true }).length).toEqual(3)
      })
    })

    describe('with two cards at the beginning of a row and two touching', () => {
      beforeEach(() => {
        props.collection.isFourWideBoard = true
        rerender()
      })

      it('should have horizontal hotspots between rows', () => {
        expect(wrapper.find('FoamcoreHotspot').length).toEqual(4)
        const hotspotProps = wrapper.find('FoamcoreHotspot').map(h => h.props())
        // 1 vertical edge and 3 row hotspots
        expect(hotspotProps.filter(p => p.horizontal).length).toEqual(3)
        expect(hotspotProps.filter(p => !p.horizontal).length).toEqual(1)
      })
    })
  })

  describe('onDragOrResizeStop', () => {
    let cardId

    beforeEach(() => {
      cardId = cards[0].id
      component.moveCards = jest.fn().mockReturnValue()
      component.resizeCard = jest.fn().mockReturnValue()
      component.dragging = true
      props.uiStore.multiMoveCardIds = [cards[0].id]
      props.uiStore.selectedCardIds = [cards[0].id]
    })

    describe('when moving', () => {
      beforeEach(() => {
        component.onDragOrResizeStop(cardId, 'move')
      })

      it('calls moveCards', () => {
        expect(component.moveCards).toHaveBeenCalledWith(cards[0])
      })
    })

    describe('when resizing', () => {
      beforeEach(() => {
        component.resizing = true
        component.onDragOrResizeStop(cardId, 'resize')
      })

      it('calls resizeCard', () => {
        expect(component.resizeCard).toHaveBeenCalledWith(cards[0])
      })
    })
  })

  describe('onResize', () => {
    let cardId

    beforeEach(() => {
      component.resizing = false
      cardId = cards[0].id
      component.throttledSetResizeSpot = jest.fn().mockReturnValue()
      component.onResize(cardId, { width: 2, height: 1 })
    })

    it('should set resizing to true', () => {
      expect(component.resizing).toBe(true)
    })

    it('should call to set the resize spot with dimensions and position', () => {
      expect(component.throttledSetResizeSpot).toHaveBeenCalledWith({
        row: cards[0].row,
        col: cards[0].col,
        width: 2,
        height: 1,
      })
    })
  })

  describe('resizeCard', () => {
    beforeEach(() => {
      component.placeholderSpot = { width: 2, height: 2 }
    })

    it('calls collection.API_batchUpdateCardsWithUndo', () => {
      component.resizeCard(cards[0])
      expect(
        props.collection.API_batchUpdateCardsWithUndo
      ).toHaveBeenCalledWith({
        updates: [
          {
            card: cards[0],
            width: 2,
            height: 2,
          },
        ],
        undoMessage: 'Card resize undone',
        onConfirm: expect.any(Function),
      })
    })

    it('calls resetCardPositions', () => {
      component.resetCardPositions = jest.fn()
      component.resizeCard(cards[0])
      expect(component.resetCardPositions).toHaveBeenCalled()
    })
  })

  describe('moveCards', () => {
    const card = { id: '1', row: 0, col: 0, record: { internalType: 'items' } }
    const card2 = { ...card, id: '2' }
    describe('when moving a single card', () => {
      beforeEach(() => {
        component.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.moveCards(card)
      })

      it('calls collection.API_batchUpdateCardsWithUndo', () => {
        expect(
          props.collection.API_batchUpdateCardsWithUndo
        ).toHaveBeenCalledWith({
          updates: [
            {
              card,
              col: 6,
              row: 7,
            },
          ],
          undoMessage: 'Card move undone',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
        })
      })
    })

    describe('when moving multiple cards', () => {
      beforeEach(() => {
        props.uiStore.multiMoveCardIds = [card.id, card2.id]
        rerender()
        component.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.dragGridSpot.set('8,9', { col: 8, row: 9, card: card2 })
        component.draggingMap = [
          { card, row: 6, col: 7 },
          { card: card2, row: 8, col: 9 },
        ]
        component.moveCards(cards[0])
      })

      it('calls collection.API_batchUpdateCardsWithUndo', () => {
        expect(
          props.collection.API_batchUpdateCardsWithUndo
        ).toHaveBeenCalledWith({
          updates: [
            {
              card,
              col: 6,
              row: 7,
            },
            {
              card: card2,
              col: 8,
              row: 9,
            },
          ],
          undoMessage: 'Card move undone',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
        })
      })
    })

    describe('when dragging from MDL', () => {
      beforeEach(() => {
        CardMoveService.moveCards = jest.fn()
        props.uiStore.draggingFromMDL = true
        component.movingCards = [card, card2]
        component.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.moveCards(card)
      })

      it('calls CardMoveService with the drag spot row/col', () => {
        expect(CardMoveService.moveCards).toHaveBeenCalledWith(
          {
            col: 6,
            row: 7,
          },
          { collection_card_ids: [] },
          // should pass in card as the "topLeftCard"
          card
        )
      })
    })

    describe('when the MoveSnackbar is open', () => {
      beforeEach(() => {
        props.uiStore.movingCardIds = [card.id, card2.id]
        props.apiStore = fakeApiStore({ findResult: card })
        rerender()
      })

      afterEach(() => {
        props.uiStore.movingCardIds = []
        props.apiStore.find.mockClear()
        CollectionCard.mockClear()
      })

      it('renders the MDL placeholder', () => {
        // 3 collection_cards + 1 MDL
        expect(wrapper.find('MovableGridCard').length).toEqual(4)
        // it creates a new CollectionCard
        expect(CollectionCard).toHaveBeenCalledTimes(1)
        const placeholderId = `${card.id}-mdlPlaceholder`
        expect(props.apiStore.updateModelId).toHaveBeenCalledWith(
          expect.any(Object),
          placeholderId
        )
        expect(wrapper.find('MovableGridCard').get(0).props.card.id).toEqual(
          placeholderId
        )
      })
    })
  })

  describe('calcEdgeCol/Row', () => {
    beforeEach(() => {
      cardA = createCard({ row: 1, col: 1 })
      cardB = createCard({ row: 1, col: 8 })
      cardC = createCard({ row: 1, col: 9 })
      const { collection } = props
      collection.cardMatrix = [[], [], [], []]
      collection.cardMatrix[1][1] = cardA
      collection.cardMatrix[1][8] = cardB
      collection.cardMatrix[1][9] = cardC

      props.collection.collection_cards = [cardA, cardB, cardC]
    })

    describe('with a card that has no cards around it', () => {
      it('should set the max column as the max card width', () => {
        const edgeCol = component.calcEdgeCol(cardA, cardA.id)
        expect(edgeCol).toEqual(4)
      })

      it('sets the max row as the max card height', () => {
        const edgeRow = component.calcEdgeRow(cardA, cardA.id)
        expect(edgeRow).toEqual(2)
      })
    })

    describe('with a card that has horizontal constraints, 2 spaces apart', () => {
      beforeEach(() => {
        cardB.row = 1
        cardB.col = 3
        const { collection } = props
        collection.cardMatrix[1][1] = cardA
        collection.cardMatrix[1][3] = cardB
        collection.cardMatrix[1][9] = cardC
      })

      it('has a maxResizeCol of 2', () => {
        const edgeCol = component.calcEdgeCol(cardA, cardA.id)
        expect(edgeCol).toEqual(2)
      })
    })

    describe('with a card that has vertical constraints, 1 space apart', () => {
      beforeEach(() => {
        cardA.row = 2
        cardB.row = 3
        cardB.col = 1
        const { collection } = props
        collection.cardMatrix[2][1] = cardA
        collection.cardMatrix[3][1] = cardB
        collection.cardMatrix[1][9] = cardC
      })

      it('has maxResizeRow of 1', () => {
        const edgeRow = component.calcEdgeRow(cardA, cardA.id)
        expect(edgeRow).toEqual(1)
      })
    })
  })

  describe('loadAfterScroll', () => {
    beforeEach(() => {
      const { collection, uiStore } = props
      collection.loadedRows = 9
      collection.loadedCols = 9
      component.loadCards = jest.fn()
      // zoomed out one level (this affects visibleRows)
      uiStore.zoomLevel = 2
    })

    describe('scrolling in loaded bounds', () => {
      beforeEach(() => {
        component.visibleCols = { min: 0, max: 4, num: 5 }
        component.visibleRows = { min: 1, max: 4, num: 4 }
      })

      it('does not call loadCards if all in view', () => {
        component.loadAfterScroll()
        expect(component.loadCards).not.toHaveBeenCalled()
      })
    })

    describe('scrolling out of bounds vertically', () => {
      it('calls loadMoreRows', () => {
        component.computeVisibleRows()
        component.loadAfterScroll()
        const minRow = props.collection.loadedRows + 1
        const expectedRows = {
          // ceil needed because visibleRows.num may be fractional
          rows: [minRow, Math.ceil(minRow + component.visibleRows.num + 3)],
        }
        expect(props.loadCollectionCards).toHaveBeenCalledWith(expectedRows)
      })
    })
  })

  describe('handleZoomIn/Out', () => {
    it('should call the respective uiStore function', () => {
      const { uiStore } = props
      component.handleZoomIn()
      expect(uiStore.zoomIn).toHaveBeenCalled()
      component.handleZoomOut()
      expect(uiStore.zoomOut).toHaveBeenCalled()
    })
  })

  describe('showZoomControls', () => {
    beforeEach(() => {
      props.collection.num_columns = 4
      props.collection.isFourWideBoard = true
      props.uiStore.zoomLevels = [4, 8]
      rerender()
    })
    it('should return true if there is more than one zoomLevel', () => {
      expect(component.showZoomControls).toEqual(true)
    })
  })

  describe('with different board sizes', () => {
    beforeEach(() => {
      props.collection.num_columns = 4
      props.collection.isFourWideBoard = true
      rerender()
    })
    it('should call uiStore.determineZoomLevels to ensure zoom is correct', () => {
      expect(props.uiStore.determineZoomLevels).toHaveBeenCalledWith(
        props.collection
      )
    })
  })
})
