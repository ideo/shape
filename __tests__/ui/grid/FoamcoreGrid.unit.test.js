import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'

let props, wrapper, instance, cards

describe('FoamcoreGrid', () => {
  beforeEach(() => {
    cards = fakeCollection.collection_cards
    cards[0].col = 5
    cards[0].row = 1
    cards[1].col = 1
    cards[1].row = 0
    cards[1].width = 2
    cards[1].height = 2
    cards[2].col = 0
    cards[2].row = 2
    props = {
      collection: fakeCollection,
      canEditCollection: true,
      gridW: 200,
      gridH: 200,
      gutter: 10,
      sortBy: 'order',
      updateCollection: jest.fn(),
      cardProperties: [],
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      routingStore: {
        routeTo: jest.fn(),
        push: jest.fn(),
      },
    }
    wrapper = shallow(<FoamcoreGrid.wrappedComponent {...props} />)
    instance = wrapper.instance()
    instance.gridRef = { scrollLeft: 0, scrollTop: 0 }
  })

  describe('componentDidMount', () => {
    it('should map out all the filled spots in in the grid as an array', () => {
      expect(instance.filledSpots.length).toEqual(6)
      const filledSpots = props.collection.collection_cards.map(card =>
        instance.filledSpots.find(
          spot => spot.row === card.row && spot.col === card.col
        )
      )
      expect(filledSpots.length).toEqual(3)
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
      props.uiStore.multiMoveCardIds = [cards[0].id]
      instance.onDragOrResizeStop(cardId, 'move')
    })

    it('should stop all dragging', () => {
      expect(instance.dragGridSpot.size).toEqual(0)
      expect(instance.dragging).toEqual(false)
      expect(props.uiStore.multiMoveCardIds.length).toBe(0)
    })

    describe('when moving', () => {
      beforeEach(() => {
        instance.onDragOrResizeStop(cardId, 'move')
      })

      it('should try and move the card with the found card', () => {
        expect(instance.moveCard).toHaveBeenCalledWith(cards[0])
      })
    })

    describe('when resizing', () => {
      beforeEach(() => {
        instance.resizing = true
        instance.onDragOrResizeStop(cardId, 'resize')
      })

      it('should try and resize the card with the found card', () => {
        expect(instance.resizeCard).toHaveBeenCalledWith(cards[0])
      })

      it('should stop all resizing and moving', () => {
        expect(instance.resizing).toEqual(false)
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

  describe('calcEdgeCol/Row', () => {
    describe('with a card that has no cards around it', () => {
      beforeEach(() => {
        cards[0].col = 1
        cards[0].row = 1
        cards[1].col = 8
        cards[1].row = 1
        cards[2].col = 1
        cards[2].row = 5
        wrapper = shallow(<FoamcoreGrid.wrappedComponent {...props} />)
        instance = wrapper.instance()
      })

      it('should set the max column as the max card width', () => {
        const edgeCol = instance.calcEdgeCol(cards[0], cards[0].id)
        expect(edgeCol).toEqual(4)
      })

      it('should set the max row as the max card height', () => {
        const edgeCol = instance.calcEdgeRow(cards[0], cards[0].id)
        expect(edgeCol).toEqual(2)
      })
    })

    describe('with a card that has horizontal contraints, 2 spaces apart', () => {})
    describe('with a card that has vertical contraints, 1 space apart', () => {})
  })

  describe('determineDragMap', () => {})
  describe('resizeCard', () => {})
  describe('moveCard', () => {})
  describe('setResizeSpot', () => {})
})
