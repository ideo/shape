import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'

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
    cardA = createCard({ col: 5, row: 1 })
    cardB = createCard({ col: 1, row: 0, width: 2, height: 2 })
    cardC = createCard({ col: 0, row: 2, width: 2 })
    const collection = fakeCollection
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

  describe('calculateFilledSpots', () => {
    it('maps out all the filled spots in the grid as an array', () => {
      expect(instance.filledSpots.length).toEqual(7)
      const firstSpot = { card: cardA, row: 1, col: 5 }
      expect(instance.filledSpots).toContainEqual(firstSpot)

      const secondSpot = { card: cardB, row: 0, col: 1 }
      expect(instance.filledSpots).toContainEqual(secondSpot)

      const lastSpot = { card: cardC, row: 2, col: 1 }
      expect(instance.filledSpots).toContainEqual(lastSpot)
    })
  })

  describe('handleMouseMove', () => {
    const fakeEv = { persist: jest.fn(), pageX: 120, pageY: 50 }

    beforeEach(() => {
      instance.throttledSetHoverSpot = jest.fn().mockReturnValue('')
      instance.handleMouseMove(fakeEv)
    })

    it('should call persist on the event', () => {
      expect(fakeEv.persist).toHaveBeenCalled()
    })

    it('should set the hover spot throttled', () => {
      expect(instance.throttledSetHoverSpot).toHaveBeenCalled()
    })
  })

  describe('handleMouseMove', () => {
    beforeEach(() => {
      instance.placeholderSpot = { row: 1, col: 1 }
      instance.handleMouseOut()
    })

    it('should reset the placeholder spot', () => {
      expect(instance.placeholderSpot.row).toBeUndefined()
      expect(instance.placeholderSpot.col).toBeUndefined()
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

  describe('onDragOrResizeStop', () => {
    let cardId

    beforeEach(() => {
      cardId = cards[0].id
      instance.moveCard = jest.fn().mockReturnValue()
      instance.resizeCard = jest.fn().mockReturnValue()
      instance.dragging = true
      // Stub this or else it causes mobx `Maximum call stack size exceeded`
      instance.calculateCardsToRender = jest.fn()
      props.uiStore.multiMoveCardIds = [cards[0].id]
      instance.onDragOrResizeStop(cardId, 'move')
    })

    it('should stop all dragging', () => {
      expect(instance.dragGridSpot.size).toEqual(0)
      expect(instance.dragging).toEqual(false)
      expect(props.uiStore.multiMoveCardIds.length).toBe(0)
      expect(instance.calculateCardsToRender).toHaveBeenCalled()
    })

    describe('when moving', () => {
      beforeEach(() => {
        instance.onDragOrResizeStop(cardId, 'move')
      })

      it('should try and move the card with the found card', () => {
        expect(instance.moveCard).toHaveBeenCalledWith(cards[0])
        expect(instance.calculateCardsToRender).toHaveBeenCalled()
      })
    })

    describe('when resizing', () => {
      beforeEach(() => {
        instance.resizing = true
        instance.onDragOrResizeStop(cardId, 'resize')
      })

      it('should try and resize the card with the found card', () => {
        expect(instance.resizeCard).toHaveBeenCalledWith(cards[0])
        expect(instance.calculateCardsToRender).toHaveBeenCalled()
      })

      it('should stop all resizing and moving', () => {
        expect(instance.resizing).toEqual(false)
        expect(instance.calculateCardsToRender).toHaveBeenCalled()
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

  describe('moveCard', () => {
    beforeEach(() => {
      instance.dragGridSpot.set('6,7', { col: 6, row: 7 })
    })

    it('calls updateCardWithUndo', () => {
      instance.updateCardWithUndo = jest.fn()
      instance.moveCard(cards[0])
      expect(instance.updateCardWithUndo).toHaveBeenCalledWith(
        cards[0],
        {
          col: 6,
          row: 7,
        },
        'Card move undone'
      )
    })

    it('calls props.collection.confirmEdit with props.updateCollection', () => {
      instance.moveCard(cards[0])
      expect(props.collection.confirmEdit).toHaveBeenCalled()
    })

    describe('when moving multiple cards', () => {
      beforeEach(() => {
        props.uiStore.multiMoveCardIds = [cards[0].id, cards[1].id]
        rerender()
      })

      it('does not call props.collection.confirmEdit', () => {
        instance.moveCard(cards[0])
        expect(props.collection.confirmEdit).not.toHaveBeenCalled()
      })
    })
  })

  describe('calcEdgeCol/Row', () => {
    beforeEach(() => {
      cardA = createCard({ col: 1, row: 1 })
      cardB = createCard({ col: 8, row: 1 })
      cardC = createCard({ col: 9, row: 9 })
      props.collection.collection_cards = [cardA, cardB, cardC]
    })

    describe('with a card that has no cards around it', () => {
      it('should set the max column as the max card width', () => {
        const edgeCol = instance.calcEdgeCol(cards[0], cards[0].id)
        expect(edgeCol).toEqual(4)
      })

      it('sets the max row as the max card height', () => {
        const edgeRow = instance.calcEdgeRow(cards[0], cards[0].id)
        expect(edgeRow).toEqual(2)
      })
    })

    describe('with a card that has horizontal contraints, 2 spaces apart', () => {
      beforeEach(() => {
        const otherCard = props.collection.collection_cards[1]
        otherCard.row = 1
        otherCard.col = 3
        rerender()
      })

      it('has a maxResizeCol of 2', () => {
        const edgeCol = instance.calcEdgeCol(cardA, cardA.id)
        expect(edgeCol).toEqual(2)
      })
    })

    describe('with a card that has vertical contraints, 1 space apart', () => {
      beforeEach(() => {
        const otherCard = props.collection.collection_cards[1]
        otherCard.row = 2
        otherCard.col = 1
        rerender()
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

  describe('determineDragMap', () => {})
  describe('resizeCard', () => {})
  describe('moveCard', () => {})
  describe('setResizeSpot', () => {})
})
