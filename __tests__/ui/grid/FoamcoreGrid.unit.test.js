import CollectionCard from '~/stores/jsonApi/CollectionCard'
import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'
import FoamcoreInteractionLayer from '~/ui/grid/interactionLayer/FoamcoreInteractionLayer'
import CardMoveService from '~/utils/CardMoveService'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard, fakeCollection, fakeItemCard } from '#/mocks/data'

// because of mdlPlaceholder... without this mock it blows up
jest.mock('../../../app/javascript/stores/jsonApi/CollectionCard')
// also allows us to mock + test that the model constructor was called
CollectionCard.mockImplementation((data, apiStore) => {
  return data
})

let props, wrapper, component, rerender
let cards, cardA, cardB, cardC
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
    collection.max_row_index = 25
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

  it('loads initial rows of cards', () => {
    expect(props.loadCollectionCards).toHaveBeenCalledWith({ rows: [0, 12] })
    expect(props.loadCollectionCards).toHaveBeenCalledWith({ rows: [13, 24] })
    expect(props.collection.API_preloadCardLayout).toHaveBeenCalled()
    expect(props.collection.replaceCardsIfDifferent).toHaveBeenCalled()
  })

  it('renders MovableGridCards', () => {
    expect(wrapper.find('MovableGridCard').length).toEqual(3)
  })

  describe('before cards have loaded', () => {
    beforeEach(() => {
      props.collection.collection_cards = []
      props.uiStore.isTransparentLoading = true
      rerender()
    })

    it('does not render the FoamcoreInteractionLayer', () => {
      expect(props.collection.collection_cards.length).toEqual(0)
      expect(wrapper.find(FoamcoreInteractionLayer).exists()).toBeFalsy()
    })
  })

  describe('after cards have loaded', () => {
    it('renders the FoamcoreInteractionLayer', () => {
      expect(props.collection.collection_cards.length).toEqual(3)
      expect(wrapper.find(FoamcoreInteractionLayer).exists()).toBeTruthy()
    })
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
      expect(props.uiStore.dragGridSpot.size).toEqual(0)
      expect(component.dragging).toEqual(false)
      expect(props.uiStore.setMovingCards).toHaveBeenCalledWith([])
    })
  })

  describe('coordinatesForPosition', () => {
    it('should call uiStore function', () => {
      const params = { x: 10, y: 20, width: 2 }
      component.coordinatesForPosition(params)
      expect(props.uiStore.coordinatesForPosition).toHaveBeenCalledWith(params)
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
        blocked: false,
      })
    })
  })

  describe('resizeCard', () => {
    beforeEach(() => {
      props.uiStore.resizeSpot = { width: 2, height: 2, blocked: false }
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

    describe('with blocked spot', () => {
      beforeEach(() => {
        props.uiStore.resizeSpot = { width: 2, height: 2, blocked: true }
      })
      it('calls resetCardPositions', () => {
        component.resetCardPositions = jest.fn()
        component.resizeCard(cards[0])
        expect(component.resetCardPositions).toHaveBeenCalled()
      })

      it('does not call collection.API_batchUpdateCardsWithUndo', () => {
        component.resizeCard(cards[0])
        expect(
          props.collection.API_batchUpdateCardsWithUndo
        ).not.toHaveBeenCalled()
      })
    })
  })

  describe('moveCards', () => {
    const card = { id: '1', row: 0, col: 0, record: { internalType: 'items' } }
    const card2 = { ...card, id: '2' }
    describe('when moving a single card', () => {
      beforeEach(() => {
        props.uiStore.dragGridSpot.set('6,7', { col: 6, row: 7, card })
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
        props.uiStore.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        props.uiStore.dragGridSpot.set('8,9', { col: 8, row: 9, card: card2 })
        rerender()
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
        props.uiStore.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.movingCards = [card, card2]
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
      const { collection } = props
      collection.loadedRows = 9
      collection.loadedCols = 9
      component.loadCards = jest.fn()
    })

    describe('scrolling in loaded bounds', () => {
      beforeEach(() => {
        props.uiStore.visibleRows = { min: 1, max: 4, num: 4 }
      })

      it('does not call loadCards if all in view', () => {
        component.loadAfterScroll()
        expect(component.loadCards).not.toHaveBeenCalled()
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

  describe('with tempTextCard', () => {
    beforeEach(() => {
      props.collection.tempTextCard = { ...fakeItemCard, id: -5 }
      rerender()
    })

    it('renders an extra MovableGridCard', () => {
      expect(component.renderVisibleCards().length).toEqual(4)
      expect(wrapper.find('MovableGridCard').length).toEqual(4)
      expect(wrapper.find('MovableGridCard').get(3).props.card.id).toEqual(-5)
    })
  })

  describe('totalGridSize', () => {
    beforeEach(() => {
      props.collection.isSplitLevel = false
      props.collection.max_row_index = 0
      props.uiStore.visibleRows = { min: 0, max: 5, num: 5 }
      rerender()
    })
    it('should calculate the right height for non-split level collections', () => {
      const { height } = component.totalGridSize
      const { relativeZoomLevel } = component
      const { gridSettings } = component
      const { gridH, gutter } = gridSettings
      const maxRows =
        props.collection.max_row_index + 1 + props.uiStore.visibleRows.num * 2
      const calculatedHeight = ((gridH + gutter) * maxRows) / relativeZoomLevel
      expect(height).toEqual(calculatedHeight)
    })

    describe('for split-level collections', () => {
      beforeEach(() => {
        props.collection.isSplitLevel = true
        rerender()
      })

      it('should calculate the right height for non-split level collections', () => {
        const { height } = component.totalGridSize
        const { relativeZoomLevel } = component
        const { gridSettings } = component
        const { gridH, gutter } = gridSettings
        const maxRows = props.collection.max_row_index + 1
        const calculatedHeight =
          ((gridH + gutter) * maxRows) / relativeZoomLevel
        expect(height).toEqual(calculatedHeight)
      })
    })

    describe('for split-level bottom collections', () => {
      beforeEach(() => {
        props.collection.isSplitLevelBottom = true
        props.collection.calculateRowsCols = jest.fn()
        rerender()
      })

      it('should calculate the right height for non-split level collections', () => {
        const { height } = component.totalGridSize
        const { relativeZoomLevel } = component
        const { gridSettings } = component
        const { gridH, gutter } = gridSettings
        const maxRows = props.collection.max_row_index + 2
        const calculatedHeight =
          ((gridH + gutter) * maxRows) / relativeZoomLevel
        expect(height).toEqual(calculatedHeight)
      })
    })
  })
})
