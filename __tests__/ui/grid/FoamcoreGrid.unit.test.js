import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'

let props, wrapper, instance, rerender, cards, cardA, cardB, cardC
let idCounter = 0

function createCard(data) {
  idCounter += 1
  const id = idCounter.toString()
  return { ...fakeCollectionCard, ...data, id }
}

describe('FoamcoreGrid', () => {
  beforeEach(() => {
    cardA = createCard({ row: 1, col: 5 })
    cardB = createCard({ row: 0, col: 1, width: 2, height: 2 })
    cardC = createCard({ row: 2, col: 0, width: 2 })
    const collection = fakeCollection

    collection.cardMatrix = [[], [], []]
    collection.cardMatrix[1][5] = cardA
    collection.cardMatrix[0][1] = cardB
    collection.cardMatrix[1][1] = cardB
    collection.cardMatrix[2][0] = cardC
    collection.cardMatrix[2][1] = cardC

    collection.collection_cards = [cardA, cardB, cardC]
    collection.confirmEdit = jest.fn()

    props = {
      collection,
      canEditCollection: true,
      gridW: 200,
      gridH: 200,
      gutter: 10,
      sortBy: 'order',
      selectedArea: { minX: null, minY: null, maxX: null, maxY: null },
      minX: null,
      loadCollectionCards: jest.fn(() => Promise.resolve()),
      updateCollection: jest.fn(),
      cardProperties: [],
      blankContentToolState: {},
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      routingStore: {
        routeTo: jest.fn(),
        push: jest.fn(),
      },
    }
    rerender = () => {
      wrapper = shallow(<FoamcoreGrid.wrappedComponent {...props} />)
      instance = wrapper.instance()
    }
    rerender()
    cards = props.collection.collection_cards
    instance.gridRef = { scrollLeft: 0, scrollTop: 0 }
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  describe('non-rendering functions', () => {
    beforeEach(() => {
      // Mock these because we ran into `Maximum call stack size exceeded`
      // errors on CI, so turning the card calculator into a mock solves that
      instance.throttledCalculateCardsToRender = jest.fn()
      instance.calculateCardsToRender = jest.fn()
    })

    describe('componentDidUpdate', () => {
      it('re-renders when cardProperties have changed', () => {
        wrapper.setProps({
          collection: { ...fakeCollection },
        })
        // no changes because we did not change cardProperties
        expect(instance.throttledCalculateCardsToRender).not.toHaveBeenCalled()
        wrapper.setProps({
          collection: { ...fakeCollection },
          cardProperties: [{ id: 'new' }],
        })
        // it does re-render with a change to cardProperties
        expect(instance.throttledCalculateCardsToRender).toHaveBeenCalled()
      })
    })

    describe('findCardOverlap', () => {
      it('finds filledSpot (or not) where a card is trying to be dragged', () => {
        // similar to calculateFilledSpots, but given a card (needs width and height >= 1)
        let fakeCard = { row: 1, col: 5, width: 1, height: 1 }
        expect(instance.findCardOverlap(fakeCard)).toEqual(cardA)
        // 2x2 should stick out and overlap cardA
        fakeCard = { row: 0, col: 4, width: 2, height: 2 }
        expect(instance.findCardOverlap(fakeCard)).toEqual(cardA)
      })
    })

    describe('onDragStart', () => {
      describe('when dragging multiple cards', () => {
        let fakeDragMap, cardId

        beforeEach(() => {
          fakeDragMap = [
            {
              card: cards[0],
              col: 0,
              row: 0,
            },
            {
              card: cards[1],
              col: 1,
              row: 0,
            },
          ]
          cardId = cards[0].id

          instance.draggingMap = []
          instance.determineDragMap = jest.fn().mockReturnValue(fakeDragMap)
          instance.onDragStart(cardId)
        })

        it('should determine the drag map with card id', () => {
          expect(instance.determineDragMap).toHaveBeenCalledWith(cardId)
        })

        it('should set the dragging map if dragging multiple cards', () => {
          expect(instance.draggingMap).toEqual(fakeDragMap)
        })
      })
    })

    describe('resetCardPositions', () => {
      beforeEach(() => {
        instance.moveCards = jest.fn().mockReturnValue()
        instance.resizeCard = jest.fn().mockReturnValue()
        instance.dragging = true
        props.uiStore.multiMoveCardIds = [cards[0].id]
        props.uiStore.selectedCardIds = [cards[0].id]
      })

      it('should stop all dragging', () => {
        instance.resetCardPositions()
        expect(instance.dragGridSpot.size).toEqual(0)
        expect(instance.dragging).toEqual(false)
        expect(props.uiStore.multiMoveCardIds.length).toBe(0)
        expect(instance.calculateCardsToRender).toHaveBeenCalled()
        // card should remain selected
        expect(props.uiStore.selectedCardIds.length).toBe(1)
      })
    })

    describe('onDragOrResizeStop', () => {
      let cardId

      beforeEach(() => {
        cardId = cards[0].id
        instance.moveCards = jest.fn().mockReturnValue()
        instance.resizeCard = jest.fn().mockReturnValue()
        instance.dragging = true
        props.uiStore.multiMoveCardIds = [cards[0].id]
        props.uiStore.selectedCardIds = [cards[0].id]
      })

      describe('when moving', () => {
        beforeEach(() => {
          instance.onDragOrResizeStop(cardId, 'move')
        })

        it('calls moveCards', () => {
          expect(instance.moveCards).toHaveBeenCalledWith(cards[0])
        })
      })

      describe('when resizing', () => {
        beforeEach(() => {
          instance.resizing = true
          instance.onDragOrResizeStop(cardId, 'resize')
        })

        it('calls resizeCard', () => {
          expect(instance.resizeCard).toHaveBeenCalledWith(cards[0])
        })
      })
    })

    describe('onResize', () => {
      let cardId

      beforeEach(() => {
        instance.resizing = false
        cardId = cards[0].id
        instance.throttledSetResizeSpot = jest.fn().mockReturnValue()
        instance.onResize(cardId, { width: 2, height: 1 })
      })

      it('should set resizing to true', () => {
        expect(instance.resizing).toBe(true)
      })

      it('should call to set the resize spot with dimensions and position', () => {
        expect(instance.throttledSetResizeSpot).toHaveBeenCalledWith({
          row: cards[0].row,
          col: cards[0].col,
          width: 2,
          height: 1,
        })
      })
    })

    describe('resizeCard', () => {
      beforeEach(() => {
        instance.placeholderSpot = { width: 2, height: 2 }
      })

      it('calls collection.API_batchUpdateCardsWithUndo', () => {
        instance.resizeCard(cards[0])
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
        instance.resetCardPositions = jest.fn()
        instance.resizeCard(cards[0])
        expect(instance.resetCardPositions).toHaveBeenCalled()
      })
    })

    describe('moveCards', () => {
      describe('when moving a single card', () => {
        beforeEach(() => {
          instance.dragGridSpot.set('6,7', { col: 6, row: 7 })
          // Dragging map has relatively positioned cards from master card at 0,0
          instance.draggingMap = [{ card: cards[0], row: 0, col: 0 }]
          instance.moveCards(cards[0])
        })

        it('calls collection.API_batchUpdateCardsWithUndo', () => {
          expect(
            props.collection.API_batchUpdateCardsWithUndo
          ).toHaveBeenCalledWith({
            updates: [
              {
                card: cards[0],
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
          props.uiStore.multiMoveCardIds = [cards[0].id, cards[1].id]
          rerender()
          instance.dragGridSpot.set('6,7', { col: 6, row: 7 })
          // Dragging map has relatively positioned cards from master card at 0,0
          instance.draggingMap = [
            { card: cards[0], row: 0, col: 0 },
            { card: cards[1], row: 2, col: 2 },
          ]
          instance.moveCards(cards[0])
        })

        it('calls collection.API_batchUpdateCardsWithUndo', () => {
          expect(
            props.collection.API_batchUpdateCardsWithUndo
          ).toHaveBeenCalledWith({
            updates: [
              {
                card: cards[0],
                col: 6,
                row: 7,
              },
              {
                card: cards[1],
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

      afterEach(() => {
        props.collection.cardMatrix = [[], [], [], []]
      })

      describe('with a card that has no cards around it', () => {
        it('should set the max column as the max card width', () => {
          const edgeCol = instance.calcEdgeCol(cardA, cardA.id)
          expect(edgeCol).toEqual(4)
        })

        it('sets the max row as the max card height', () => {
          const edgeRow = instance.calcEdgeRow(cardA, cardA.id)
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
          const edgeCol = instance.calcEdgeCol(cardA, cardA.id)
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
          const edgeRow = instance.calcEdgeRow(cardA, cardA.id)
          expect(edgeRow).toEqual(1)
        })
      })
    })

    describe('loadAfterScroll', () => {
      beforeEach(() => {
        instance.loadedRows = { min: 0, max: 9 }
        instance.loadedCols = { min: 0, max: 9 }
        instance.loadCards = jest.fn()
      })

      describe('scrolling in loaded bounds', () => {
        beforeEach(() => {
          // `Object.defineProperty` is the only way I could find to stub getter methods
          Object.defineProperty(instance, 'visibleCols', {
            get: jest.fn().mockReturnValue({ min: 0, max: 4, num: 5 }),
          })
          Object.defineProperty(instance, 'visibleRows', {
            get: jest.fn().mockReturnValue({ min: 1, max: 4, num: 4 }),
          })
        })

        it('does not call loadCards if all in view', () => {
          instance.loadAfterScroll()
          expect(instance.loadCards).not.toHaveBeenCalled()
        })
      })

      describe('scrolling out of bounds vertically', () => {
        beforeEach(() => {
          Object.defineProperty(instance, 'visibleRows', {
            get: jest.fn().mockReturnValue({ min: 4, max: 8, num: 4 }),
          })
          Object.defineProperty(instance, 'visibleCols', {
            get: jest.fn().mockReturnValue({ min: 0, max: 4, num: 5 }),
          })
        })

        it('calls loadMoreRows', () => {
          const expectedRowsCols = {
            cols: [0, 10],
            rows: [10, 14],
          }
          instance.loadAfterScroll()
          expect(instance.loadCards).toHaveBeenCalledWith(expectedRowsCols)
        })
      })

      describe('scrolling out of bounds horizontally', () => {
        beforeEach(() => {
          Object.defineProperty(instance, 'visibleCols', {
            get: jest.fn().mockReturnValue({ min: 2, max: 6, num: 5 }),
          })
          Object.defineProperty(instance, 'visibleRows', {
            get: jest.fn().mockReturnValue({ min: 0, max: 3, num: 4 }),
          })
        })

        it('calls loadMoreRows', () => {
          const expectedRowsCols = {
            cols: [10, 15],
            rows: [0, 8],
          }
          instance.loadAfterScroll()
          expect(instance.loadCards).toHaveBeenCalledWith(expectedRowsCols)
        })
      })
    })

    describe('loadCards', () => {
      beforeEach(() => {
        props.loadCollectionCards = jest.fn()
        rerender()
      })

      it('calls props.loadCollectionCards', () => {
        const rowsCols = {
          cols: [10, 15],
          rows: [0, 8],
        }
        instance.loadCards(rowsCols)
        expect(props.loadCollectionCards).toHaveBeenCalledWith(rowsCols)
      })
    })

    describe('updateSelectedArea', () => {
      beforeEach(() => {
        cardA = createCard({ row: 0, col: 1 })
        cardB = createCard({ row: 1, col: 2 })
        cardC = createCard({ row: 3, col: 3 })
        props.collection.collection_cards = [cardA, cardB, cardC]
      })

      describe('selected area not matching any cards', () => {
        beforeEach(() => {
          props.collection.cardIdsWithinRectangle = jest
            .fn()
            .mockReturnValue([])
          rerender()
          props.uiStore.selectedCardIds = []
          props.selectedArea = { minX: 500, minY: 10, maxX: 550, maxY: 20 }
          // It would be nice if we could use the real Collection class
          // instead of having to mock the return value:
          instance.componentDidUpdate(props)
        })

        it('does not set uiStore.selectedCardIds', () => {
          expect(props.uiStore.selectedCardIds).toEqual([])
        })
      })

      describe('selected area matching two cards', () => {
        beforeEach(() => {
          props.selectedArea = { minX: 40, minY: 150, maxX: 550, maxY: 450 }
          // It would be nice if we could use the real Collection class
          // instead of having to mock the return value:
          props.collection.cardIdsWithinRectangle = jest
            .fn()
            .mockReturnValue([cardA.id, cardB.id])
          rerender()
          instance.componentDidUpdate(props)
        })

        it('sets uiStore.selectedCardIds', () => {
          expect(props.uiStore.selectedCardIds).toEqual([cardA.id, cardB.id])
        })
      })
    })
  })
})
